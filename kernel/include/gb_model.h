#ifndef GB_MODEL_H
#define GB_MODEL_H

#include <linux/types.h>

/**
 * @pid: process ID
 * @start_time: process start time
 *
 * A task_struct is uniquely identified by these two parameters. Do not rely
 * on PID alone, since PIDs can be reused after a task exits.
 */
struct gb_task_key {
	pid_t pid;
	u64 start_time;
};

#endif /* GB_MODEL_H */
