#include "gb_helper.h"
#include "gb_model.h"
#include "gb_taskview.h"
#include <linux/sched.h>
#include <linux/sched/task.h>
#include <linux/slab.h>

static void gb_taskview_fill(struct gb_taskview *taskview,
			     struct task_struct *task)
{
	// identity
	taskview->pid = task->pid;
	taskview->tgid = task->tgid;
	taskview->start_time = task->start_time;
	strscpy(taskview->name, task->comm, sizeof(taskview->name));

	// state
	taskview->state = READ_ONCE(task->__state);
}

struct gb_taskview *gb_taskview_get(struct gb_task_key key)
{
	struct task_struct *task;
	struct gb_taskview *result;

	task = gb_find_get_task(key);
	if (!task) {
		return ERR_PTR(-ESRCH);
	}

	result = kmalloc(sizeof(*result), GFP_KERNEL);
	if (!result) {
		put_task_struct(task);
		return ERR_PTR(-ENOMEM);
	}

	gb_taskview_fill(result, task);

	// decrement refcount
	put_task_struct(task);

	return result;
}

void gb_taskview_free(struct gb_taskview *taskview)
{
	kfree(taskview);
}
