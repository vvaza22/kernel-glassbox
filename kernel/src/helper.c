#include "gb_helper.h"
#include "gb_model.h"
#include <linux/bug.h>
#include <linux/pid.h>
#include <linux/pid_namespace.h>
#include <linux/rcupdate.h>

/**
 * gb_find_get_task_by_pid_init - Finds a task by initial namespace PID and gets a reference.
 * The function's logic is based on find_get_task_by_vpid() from linux kernel source code:
 * https://elixir.bootlin.com/linux/v6.12.74/source/kernel/pid.c#L438
 * However, the function is not exported by the kernel and I had to reimplement it.
 * My implementation is slightly different as I only search using the initial namespace PID,
 * not the current virtual PID.
 */
static struct task_struct *gb_find_get_task_by_pid_init(pid_t pid)
{
	struct task_struct *result = NULL;

	rcu_read_lock();
	result = pid_task(find_pid_ns(pid, &init_pid_ns), PIDTYPE_PID);
	if (result) {
		// increment refcount
		get_task_struct(result);
	}
	rcu_read_unlock();

	return result;
}

struct task_struct *gb_find_get_task(struct gb_task_key key)
{
	struct task_struct *result;

	result = gb_find_get_task_by_pid_init(key.pid);

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
