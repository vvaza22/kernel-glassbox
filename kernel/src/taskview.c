#include "gb_helper.h"
#include "gb_model.h"
#include "gb_taskview.h"
#include <linux/cred.h>
#include <linux/sched.h>
#include <linux/sched/mm.h>
#include <linux/sched/task.h>
#include <linux/slab.h>

static void gb_taskview_fill_sched_data(struct gb_sched_data *sched,
					struct task_struct *task)
{
	sched->prio = READ_ONCE(task->prio);
	sched->static_prio = READ_ONCE(task->static_prio);
	sched->normal_prio = READ_ONCE(task->normal_prio);
	/* TODO: vruntime and sum_exec_runtime may be out of sync */
	/* TODO: this only works on x64 architecture */
	sched->vruntime = READ_ONCE(task->se.vruntime);
	/* Safe for x64, source:task_sched_runtime() from linux kernel source code
	https://elixir.bootlin.com/linux/v6.12.74/source/kernel/sched/core.c#L5508 */
	sched->sum_exec_runtime = READ_ONCE(task->se.sum_exec_runtime);
}

static void gb_taskview_fill_memory_data(struct gb_memory_data *memdata,
					 struct task_struct *task)
{
	struct mm_struct *mm;

	mm = get_task_mm(task);
	if (!mm) {
		return;
	}

	/* https://elixir.bootlin.com/linux/v6.12.74/source/include/linux/mm_types.h#L911 */
	mmap_read_lock(mm);
	memdata->mmap_base = mm->mmap_base;
	memdata->task_size = mm->task_size;
	memdata->total_vm = mm->total_vm;
	memdata->locked_vm = mm->locked_vm;
	memdata->data_vm = mm->data_vm;
	memdata->exec_vm = mm->exec_vm;
	memdata->stack_vm = mm->stack_vm;
	mmap_read_unlock(mm);

	/* https://elixir.bootlin.com/linux/v6.12.74/source/include/linux/mm_types.h#L955 */
	spin_lock(&mm->arg_lock);

	memdata->start_code = mm->start_code;
	memdata->end_code = mm->end_code;

	memdata->start_data = mm->start_data;
	memdata->end_data = mm->end_data;

	memdata->start_brk = mm->start_brk;
	memdata->brk = mm->brk;

	memdata->start_stack = mm->start_stack;

	memdata->arg_start = mm->arg_start;
	memdata->arg_end = mm->arg_end;

	memdata->env_start = mm->env_start;
	memdata->env_end = mm->env_end;

	spin_unlock(&mm->arg_lock);

	mmput(mm);
}

static void gb_taskview_fill_cred_data(struct gb_cred_data *real_cred_data,
				       struct task_struct *task)
{
	const struct cred *cred;

	cred = get_task_cred(task);
	if (!cred) {
		return;
	}

	/* https://elixir.bootlin.com/linux/v6.12.74/source/include/linux/cred.h#L111 */
	real_cred_data->uid = cred->uid;
	real_cred_data->gid = cred->gid;
	real_cred_data->suid = cred->suid;
	real_cred_data->sgid = cred->sgid;
	real_cred_data->euid = cred->euid;
	real_cred_data->egid = cred->egid;

	put_cred(cred);
}

static void gb_taskview_fill_parents(struct gb_task_key *parent_key,
				     struct gb_task_key *real_parent_key,
				     struct task_struct *task)
{
	struct task_struct *parent;
	struct task_struct *real_parent;

	rcu_read_lock();

	parent = rcu_dereference(task->parent);
	if (parent) {
		parent_key->pid = parent->pid;
		parent_key->start_time = parent->start_time;
	}

	real_parent = rcu_dereference(task->real_parent);
	if (real_parent) {
		real_parent_key->pid = real_parent->pid;
		real_parent_key->start_time = real_parent->start_time;
	}

	rcu_read_unlock();
}

static void gb_taskview_fill(struct gb_taskview *taskview,
			     struct task_struct *task)
{
	/* identity */
	taskview->pid = task->pid;
	taskview->tgid = task->tgid;
	taskview->start_time = task->start_time;
	get_task_comm(taskview->comm, task);
	gb_taskview_fill_parents(&taskview->parent, &taskview->real_parent,
				 task);

	/* security */
#ifdef CONFIG_STACKPROTECTOR
	/* TODO: security risk, when any program can access the taskview feature */
	taskview->stack_canary = READ_ONCE(task->stack_canary);
#endif

	/* state */
	taskview->state = READ_ONCE(task->__state);
	taskview->exit_state = READ_ONCE(task->exit_state);
	taskview->exit_code = READ_ONCE(task->exit_code);
	taskview->exit_signal = READ_ONCE(task->exit_signal);

	/* creds */
	gb_taskview_fill_cred_data(&taskview->real_cred, task);

	/* scheduler */
	gb_taskview_fill_sched_data(&taskview->sched, task);

	/* memory */
	gb_taskview_fill_memory_data(&taskview->mem, task);
}

struct gb_taskview *gb_taskview_get(struct gb_task_key key)
{
	struct task_struct *task;
	struct gb_taskview *result;

	result = kzalloc(sizeof(*result), GFP_KERNEL);
	if (!result) {
		return ERR_PTR(-ENOMEM);
	}

	task = gb_find_get_task(key);
	if (!task) {
		kfree(result);
		return ERR_PTR(-ESRCH);
	}

	gb_taskview_fill(result, task);

	/* decrement refcount */
	put_task_struct(task);

	return result;
}

void gb_taskview_free(struct gb_taskview *taskview)
{
	kfree(taskview);
}
