#include "gb_schedhook.h"
#include <asm-generic/bug.h>
#include <linux/completion.h>
#include <linux/err.h>
#include <linux/jiffies.h>
#include <linux/atomic/atomic-instrumented.h>
#include <linux/cpuhplock.h>
#include <linux/tracepoint.h>
#include <linux/cpumask.h>
#include <linux/percpu-defs.h>
#include <linux/timekeeping.h>
#include <trace/events/sched.h>

/*
 * TRACE_EVENT(sched_switch) https://elixir.bootlin.com/linux/v6.12.74/source/include/trace/events/sched.h#L222
 */
static DEFINE_PER_CPU(struct gb_schedhook_data_per_cpu, _gb_schedhook_data);
static atomic_t _gb_schedhook_state = ATOMIC_INIT(GB_SCHEDHOOK_STATE_WAITING);
static atomic_t _gb_schedhook_total_cpus = ATOMIC_INIT(0);
static atomic_t _gb_schedhook_num_cpus_working = ATOMIC_INIT(0);
static DECLARE_COMPLETION(_gb_schedhook_completion);

static void _gb_schedhook_probe(void *_, bool preemptible,
				struct task_struct *prev,
				struct task_struct *next,
				unsigned int prev_state)
{
	struct gb_schedhook_data_per_cpu *wrapper =
		this_cpu_ptr(&_gb_schedhook_data);
	struct gb_schedhook_data_switch *data;
	int cpu = smp_processor_id();

	if (atomic_read(&_gb_schedhook_state) != GB_SCHEDHOOK_STATE_RUNNING) {
		return;
	}

	if (!wrapper->allowed) {
		return;
	}

	if (wrapper->index >= GB_SCHEDHOOK_MAX_PER_CPU_SWITCH)
		return;

	data = &wrapper->switches[wrapper->index];
	data->cpu = cpu;
	data->timestamp = ktime_get_ns();
	data->prev_task.pid = READ_ONCE(prev->pid);
	data->prev_task.start_time = READ_ONCE(prev->start_time);
	data->next_task.pid = READ_ONCE(next->pid);
	data->next_task.start_time = READ_ONCE(next->start_time);

	/* Make sure all writes are complete before updating the index */
	smp_mb();
	wrapper->index = wrapper->index + 1;
	smp_mb();

	if (wrapper->index != GB_SCHEDHOOK_MAX_PER_CPU_SWITCH)
		return;

	if (!atomic_dec_and_test(&_gb_schedhook_num_cpus_working))
		return;

	if (atomic_cmpxchg(&_gb_schedhook_state, GB_SCHEDHOOK_STATE_RUNNING,
			   GB_SCHEDHOOK_STATE_DONE) !=
	    GB_SCHEDHOOK_STATE_RUNNING) {
		return;
	}

	complete(&_gb_schedhook_completion);
}

static void _gb_schedhook_data_reset(struct gb_schedhook_data_switch *d)
{
	d->cpu = -1;
	d->timestamp = 0;
	d->prev_task.pid = -1;
	d->prev_task.start_time = 0;
	d->next_task.pid = -1;
	d->next_task.start_time = 0;
}

int gb_schedhook_init(void)
{
	int ret;

	ret = register_trace_sched_switch(_gb_schedhook_probe, NULL);
	if (ret) {
		pr_err("Failed to register sched_switch tracepoint: %d\n", ret);
		return ret;
	}
	init_completion(&_gb_schedhook_completion);

	return 0;
}

/*
 * Possible state transitions:
 * WAITING -> PREPARING -> RUNNING -> DONE -> WAITING
 */

int gb_schedhook_cap_start(void)
{
	int cpu;
	int orig;

	/*
	 * Only one CPU will be able to change the state from WAITING to PREPARING, other CPUs
	 * will instantly fail and return -EBUSY. State won't be changed back to WAITING until
	 * the capture is finished.
	 */
	orig = atomic_cmpxchg(&_gb_schedhook_state, GB_SCHEDHOOK_STATE_WAITING,
			      GB_SCHEDHOOK_STATE_PREPARING);
	if (orig != GB_SCHEDHOOK_STATE_WAITING) {
		return -EBUSY;
	}

	reinit_completion(&_gb_schedhook_completion);

	/* Make sure the number of online CPUs stays the same inside the critical section */
	cpus_read_lock();

	atomic_set(&_gb_schedhook_num_cpus_working, num_online_cpus());
	atomic_set(&_gb_schedhook_total_cpus, num_online_cpus());

	for_each_possible_cpu(cpu) {
		struct gb_schedhook_data_per_cpu *d =
			per_cpu_ptr(&_gb_schedhook_data, cpu);
		d->index = 0;
		d->allowed = false;

		for (int i = 0; i < GB_SCHEDHOOK_MAX_PER_CPU_SWITCH; i++) {
			_gb_schedhook_data_reset(&d->switches[i]);
		}
	}

	for_each_online_cpu(cpu) {
		struct gb_schedhook_data_per_cpu *d =
			per_cpu_ptr(&_gb_schedhook_data, cpu);
		d->allowed = true;
	}

	cpus_read_unlock();

	/* Defensive: Ensure all writes are complete */
	smp_mb();

	/* Only tell the probe to start capturing AFTER everything else is setup */
	orig = atomic_cmpxchg(&_gb_schedhook_state,
			      GB_SCHEDHOOK_STATE_PREPARING,
			      GB_SCHEDHOOK_STATE_RUNNING);
	if (WARN_ON(orig != GB_SCHEDHOOK_STATE_PREPARING)) {
		return -EINVAL;
	}

	return 0;
}

static struct gb_schedhook_result *_gb_schedhook_get_result(int time_left)
{
	struct gb_schedhook_result *result;
	int cpu;
	int idx;
	int max_sz;

	if (WARN_ON(atomic_read(&_gb_schedhook_state) !=
		    GB_SCHEDHOOK_STATE_DONE)) {
		return ERR_PTR(-EINVAL);
	}

	result = kzalloc(sizeof(*result), GFP_KERNEL);
	if (!result) {
		return ERR_PTR(-ENOMEM);
	}

	result->total_cpus = atomic_read(&_gb_schedhook_total_cpus);
	result->done_cpus = 0;
	result->time_left = time_left;

	/* Allocate maximum possible array */
	max_sz = result->total_cpus * GB_SCHEDHOOK_MAX_PER_CPU_SWITCH;
	result->data = kcalloc(max_sz, sizeof(struct gb_schedhook_data_switch),
			       GFP_KERNEL);
	if (!result->data) {
		kfree(result);
		return ERR_PTR(-ENOMEM);
	}

	/* It is possible that some CPUs that finished the task, are no longer active */
	idx = 0;
	for_each_possible_cpu(cpu) {
		int i;
		int num_switches;
		struct gb_schedhook_data_per_cpu *d =
			per_cpu_ptr(&_gb_schedhook_data, cpu);

		/* 
		 * d->index might increase after this, but I don't care.
		 * I know that i'th entry for i < num_switches are complete.
		 */
		num_switches = d->index;
		if (num_switches == 0)
			continue;

		result->done_cpus++;

		for (i = 0; i < num_switches; i++) {
			if (WARN_ON(idx == max_sz)) {
				// Defensive: truncate the result, but should not happen
				goto save_idx_and_ret;
			}
			result->data[idx++] = d->switches[i];
		}
	}

save_idx_and_ret:
	result->num_switches = idx;
	return result;
}

void gb_schedhook_result_free(struct gb_schedhook_result *result)
{
	if (!result)
		return;

	kfree(result->data);
	kfree(result);
}

struct gb_schedhook_result *gb_schedhook_cap_wait(void)
{
	int orig;
	int time_left;

	time_left = wait_for_completion_timeout(
		&_gb_schedhook_completion,
		msecs_to_jiffies(GB_SCHEDHOOK_TIMEOUT_MS));

	/* Manually trigger: RUNNING -> DONE */
	orig = atomic_cmpxchg(&_gb_schedhook_state, GB_SCHEDHOOK_STATE_RUNNING,
			      GB_SCHEDHOOK_STATE_DONE);

	/*
	 * Case 1: Task was finished on time, no change in state DONE -> DONE
	 * Case 2: Deadline was hit, forcefully change RUNNING -> DONE
	 */
	if (WARN_ON(orig != GB_SCHEDHOOK_STATE_RUNNING &&
		    orig != GB_SCHEDHOOK_STATE_DONE)) {
		return ERR_PTR(-EINVAL);
	}

	return _gb_schedhook_get_result(time_left);
}

void gb_schedhook_cap_finish(void)
{
	int orig;
	orig = atomic_cmpxchg(&_gb_schedhook_state, GB_SCHEDHOOK_STATE_DONE,
			      GB_SCHEDHOOK_STATE_WAITING);
	WARN_ON(orig != GB_SCHEDHOOK_STATE_DONE);
}

void gb_schedhook_exit(void)
{
	unregister_trace_sched_switch(_gb_schedhook_probe, NULL);
	tracepoint_synchronize_unregister();
}
