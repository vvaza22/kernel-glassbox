#include "gb_schedhook.h"
#include "linux/string.h"
#include <linux/spinlock.h>
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
 * TRACE_EVENT(sched_switch) 
 * https://elixir.bootlin.com/linux/v6.12.74/source/include/trace/events/sched.h#L222
 */
static DEFINE_PER_CPU(struct gb_schedhook_data_per_cpu, _gb_schedhook_data);
static atomic_t _gb_schedhook_state = ATOMIC_INIT(GB_SCHEDHOOK_STATE_WAITING);

static void _gb_schedhook_probe(void *_, bool preemptible,
				struct task_struct *prev,
				struct task_struct *next,
				unsigned int prev_state)
{
	struct gb_schedhook_data_per_cpu *wrapper =
		this_cpu_ptr(&_gb_schedhook_data);
	int cpu = smp_processor_id();
	struct gb_schedhook_event *event;
	unsigned long flags;

	if (atomic_read(&_gb_schedhook_state) != GB_SCHEDHOOK_STATE_RUNNING) {
		return;
	}

	/* Sources I used to learn about locks:
	https://www.kernel.org/doc/html/latest/locking/spinlocks.html
	https://stackoverflow.com/questions/2559602/spin-lock-irqsave-vs-spin-lock-irq#14963815
	*/

	spin_lock_irqsave(&wrapper->lock, flags);

	if (wrapper->num_events >= GB_SCHEDHOOK_MAX_EVENTS_PER_CPU)
		goto done;

	event = &wrapper->events[wrapper->num_events];
	event->prev.pid = READ_ONCE(prev->pid);
	event->prev.start_time = READ_ONCE(prev->start_time);
	event->next.pid = READ_ONCE(next->pid);
	event->next.start_time = READ_ONCE(next->start_time);
	/* 
	Theoretical risk: Other CPU can call set_task_comm() in this moment and
	this will yield torn/intermediate comm, but that's ok for now.
	*/
	strscpy_pad(event->comm_prev, prev->comm, TASK_COMM_LEN);
	strscpy_pad(event->comm_next, next->comm, TASK_COMM_LEN);
	event->timestamp = ktime_get_ns();
	event->cpu = cpu;
	wrapper->num_events++;

done:
	spin_unlock_irqrestore(&wrapper->lock, flags);
	return;
}

static void _gb_schedhook_data_reset(struct gb_schedhook_data_per_cpu *d)
{
	unsigned long flags;
	int i;

	spin_lock_irqsave(&d->lock, flags);
	d->num_events = 0;

	for (i = 0; i < GB_SCHEDHOOK_MAX_EVENTS_PER_CPU; i++) {
		d->events[i].cpu = -1;
		d->events[i].timestamp = -1;
		d->events[i].prev.pid = -1;
		d->events[i].prev.start_time = -1;
		d->events[i].next.pid = -1;
		d->events[i].next.start_time = -1;
	}

	spin_unlock_irqrestore(&d->lock, flags);
}

int gb_schedhook_init(void)
{
	int ret;
	int cpu;

	for_each_possible_cpu(cpu) {
		struct gb_schedhook_data_per_cpu *d =
			per_cpu_ptr(&_gb_schedhook_data, cpu);
		spin_lock_init(&d->lock);
		_gb_schedhook_data_reset(d);
	}

	ret = register_trace_sched_switch(_gb_schedhook_probe, NULL);
	if (ret) {
		pr_err("%s: Failed to register sched_switch tracepoint: %d\n",
		       __func__, ret);
	}

	return ret;
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

	for_each_possible_cpu(cpu) {
		struct gb_schedhook_data_per_cpu *d =
			per_cpu_ptr(&_gb_schedhook_data, cpu);
		_gb_schedhook_data_reset(d);
	}

	/* Only tell the probe to start capturing AFTER everything else is setup */
	orig = atomic_cmpxchg(&_gb_schedhook_state,
			      GB_SCHEDHOOK_STATE_PREPARING,
			      GB_SCHEDHOOK_STATE_RUNNING);
	if (WARN_ON(orig != GB_SCHEDHOOK_STATE_PREPARING)) {
		return -EINVAL;
	}

	return 0;
}

static bool _gb_schedhook_fill_cpu_data(struct gb_schedhook_cap *cap,
					struct gb_schedhook_data_per_cpu *d)
{
	unsigned long flags;
	int i;
	bool res = true;

	/*
	It is possible that after RUNNING->DONE transition,
	some CPUs are still in the middle of context switch after the state IF cond check.
	The following line of code, could acquire the lock before them.

	If the other CPU acquires the lock after the following code executes,
	It will just write new event in the next slot and it won't be included in the snapshot.

	It is also possible that CPU acquires the lock very late, after the state is reset to WAITING.
	In this case whatever the CPU writes will be erased in the next cap_start() call.

	If CPU acquires the lock extremly late, like in the next RUNNING state.
	It will write new event at index=0, which will be included in the next snapshot.
	*/
	spin_lock_irqsave(&d->lock, flags);

	for (i = 0; i < d->num_events; i++) {
		if (cap->cnt == GB_SCHEDHOOK_MAX_EVENTS) {
			res = false;
			goto done;
		}
		cap->events[cap->cnt++] = d->events[i];
	}

done:
	spin_unlock_irqrestore(&d->lock, flags);
	return res;
}

static struct gb_schedhook_cap *_gb_schedhook_get_result(void)
{
	struct gb_schedhook_cap *result;
	int cpu;

	result = kzalloc(sizeof(*result), GFP_KERNEL);
	if (!result) {
		return ERR_PTR(-ENOMEM);
	}

	result->events = kcalloc(GB_SCHEDHOOK_MAX_EVENTS,
				 sizeof(struct gb_schedhook_event), GFP_KERNEL);
	if (!result->events) {
		kfree(result);
		return ERR_PTR(-ENOMEM);
	}

	/* It is possible that some CPUs that finished the task, are no longer active */
	for_each_possible_cpu(cpu) {
		struct gb_schedhook_data_per_cpu *d =
			per_cpu_ptr(&_gb_schedhook_data, cpu);
		if (!_gb_schedhook_fill_cpu_data(result, d)) {
			break;
		}
	}

	return result;
}

void gb_schedhook_cap_free(struct gb_schedhook_cap *cap)
{
	if (!cap)
		return;

	kfree(cap->events);
	kfree(cap);
}

/*
 * Caller should wait for some amount of time for the buffer to fill up and
 * then call this function.
 */
struct gb_schedhook_cap *gb_schedhook_cap_end(void)
{
	struct gb_schedhook_cap *result;
	int orig;

	orig = atomic_cmpxchg(&_gb_schedhook_state, GB_SCHEDHOOK_STATE_RUNNING,
			      GB_SCHEDHOOK_STATE_DONE);

	if (orig != GB_SCHEDHOOK_STATE_RUNNING) {
		return ERR_PTR(-EPERM);
	}

	result = _gb_schedhook_get_result();

	orig = atomic_cmpxchg(&_gb_schedhook_state, GB_SCHEDHOOK_STATE_DONE,
			      GB_SCHEDHOOK_STATE_WAITING);
	WARN_ON(orig != GB_SCHEDHOOK_STATE_DONE);

	return result;
}

void gb_schedhook_exit(void)
{
	unregister_trace_sched_switch(_gb_schedhook_probe, NULL);
	tracepoint_synchronize_unregister();
}
