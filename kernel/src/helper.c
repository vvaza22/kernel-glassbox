#include "gb_helper.h"
#include "gb_model.h"
#include <linux/pid.h>
#include <linux/pid_namespace.h>

static struct task_struct *gb_find_get_task_helper(pid_t pid)
{
	struct pid *pid_struct;
	struct task_struct *result;

	pid_struct = find_pid_ns(pid, &init_pid_ns);
	if (!pid_struct) {
		return NULL;
	}

	result = pid_task(pid_struct, PIDTYPE_PID);
	if (!result) {
		return NULL;
	}

	// increment refcount
	get_task_struct(result);

	return result;
}

struct task_struct *gb_find_get_task(struct gb_task_key key)
{
	struct task_struct *result;

	rcu_read_lock();
	result = gb_find_get_task_helper(key.pid);
	rcu_read_unlock();

	if (!result) {
		// get_task_struct never happend
		return NULL;
	}

	// PID might be reused, verify start time
	if (result->start_time != key.start_time) {
		put_task_struct(result);
		return NULL;
	}

	return result;
}
