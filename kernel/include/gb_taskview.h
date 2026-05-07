#ifndef GB_TASKVIEW_H
#define GB_TASKVIEW_H

#include "gb_model.h"
#include <linux/sched.h>
#include <linux/types.h>

struct gb_taskview {
	// identity
	pid_t pid;
	pid_t tgid;
	u64 start_time;
	char name[TASK_COMM_LEN];
	// state
	unsigned int state;
};

struct gb_taskview *gb_taskview_get(struct gb_task_key key);
void gb_taskview_free(struct gb_taskview *taskview);

#endif /* GB_TASKVIEW_H */
