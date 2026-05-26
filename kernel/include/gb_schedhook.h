#ifndef GB_SCHEDHOOK_H
#define GB_SCHEDHOOK_H

#include "gb_model.h"
#include "linux/cache.h"
#include "linux/spinlock_types.h"
#include <linux/types.h>
#include <linux/sched.h>
#include <linux/percpu-defs.h>

#define GB_SCHEDHOOK_MAX_EVENTS 500
#define GB_SCHEDHOOK_MAX_EVENTS_PER_CPU 100

#define GB_SCHEDHOOK_STATE_WAITING 0
#define GB_SCHEDHOOK_STATE_PREPARING 1
#define GB_SCHEDHOOK_STATE_RUNNING 2
#define GB_SCHEDHOOK_STATE_DONE 3

struct gb_schedhook_cap {
	struct gb_schedhook_event *events;
	int cnt;
};

struct gb_schedhook_event {
	struct gb_task_key prev;
	struct gb_task_key next;
	char comm_prev[TASK_COMM_LEN];
	char comm_next[TASK_COMM_LEN];
	u64 timestamp;
	int cpu;
	bool prev_is_kthread;
	bool next_is_kthread;
};

struct gb_schedhook_data_per_cpu {
	spinlock_t lock;
	struct gb_schedhook_event events[GB_SCHEDHOOK_MAX_EVENTS_PER_CPU];
	int num_events;
} ____cacheline_aligned;

int gb_schedhook_init(void);
int gb_schedhook_cap_start(void);
struct gb_schedhook_cap *gb_schedhook_cap_end(void);
void gb_schedhook_cap_free(struct gb_schedhook_cap *cap);
void gb_schedhook_exit(void);

#endif /* GB_SCHEDHOOK_H */
