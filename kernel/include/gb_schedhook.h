#ifndef GB_SCHEDHOOK_H
#define GB_SCHEDHOOK_H

#include "gb_model.h"
#include <linux/types.h>
#include <linux/sched.h>
#include <linux/percpu-defs.h>

#define GB_SCHEDHOOK_MAX_PER_CPU_SWITCH 100

#define GB_SCHEDHOOK_STATE_WAITING 0
#define GB_SCHEDHOOK_STATE_PREPARING 1
#define GB_SCHEDHOOK_STATE_RUNNING 2
#define GB_SCHEDHOOK_STATE_DONE 3

#define GB_SCHEDHOOK_TIMEOUT_MS 300

struct gb_schedhook_result {
	struct gb_schedhook_data_switch *data;
	int num_switches;
	int total_cpus;
	int done_cpus;
	int time_left;
};
void gb_schedhook_result_free(struct gb_schedhook_result *result);

struct gb_schedhook_data_switch {
	struct gb_task_key prev_task;
	struct gb_task_key next_task;
	u64 timestamp;
	int cpu;
};

struct gb_schedhook_data_per_cpu {
	struct gb_schedhook_data_switch
		switches[GB_SCHEDHOOK_MAX_PER_CPU_SWITCH];
	int index;
	bool allowed;
};

int gb_schedhook_init(void);
int gb_schedhook_cap_start(void);
struct gb_schedhook_result *gb_schedhook_cap_wait(void);
void gb_schedhook_cap_finish(void);
void gb_schedhook_exit(void);

#endif /* GB_SCHEDHOOK_H */
