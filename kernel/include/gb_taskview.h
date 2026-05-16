#ifndef GB_TASKVIEW_H
#define GB_TASKVIEW_H

#include "gb_model.h"
#include <linux/sched.h>
#include <linux/types.h>

/*
 * This file creates a wrapper for task_struct and related data structures,
 * in order to safely send the information to user space via netlink.
 * My structs repeat the field names found in the original structures.
 * I've attached original linux source code links in the comments.
 */

struct gb_cred_data {
	/* https://elixir.bootlin.com/linux/v6.12.74/source/include/linux/cred.h#L111 */
	kuid_t uid;
	kgid_t gid;
	kuid_t suid;
	kgid_t sgid;
	kuid_t euid;
	kgid_t egid;
};

struct gb_sched_data {
	/* https://elixir.bootlin.com/linux/v6.12.74/source/include/linux/sched.h#L541 */
	int prio;
	int static_prio;
	int normal_prio;
	u64 vruntime;
	u64 sum_exec_runtime;
};

struct gb_memory_data {
	/* https://elixir.bootlin.com/linux/v6.12.74/source/include/linux/mm_types.h#L825 */
	unsigned long mmap_base;
	unsigned long task_size;

	/* page counts */
	unsigned long total_vm;
	unsigned long locked_vm;
	unsigned long data_vm;
	unsigned long exec_vm;
	unsigned long stack_vm;

	/* code segment */
	unsigned long start_code;
	unsigned long end_code;

	/* data segment */
	unsigned long start_data;
	unsigned long end_data;

	/* heap */
	unsigned long start_brk;
	unsigned long brk;

	/* stack */
	unsigned long start_stack;

	/* arguments */
	unsigned long arg_start;
	unsigned long arg_end;

	/* environment */
	unsigned long env_start;
	unsigned long env_end;
};

struct gb_taskview {
	/* identity */
	pid_t pid;
	pid_t tgid;
	u64 start_time;
	char comm[TASK_COMM_LEN];
	struct gb_task_key parent;
	struct gb_task_key real_parent;

	/* state */
	unsigned int state;
	int exit_state;
	int exit_code;
	int exit_signal;

	/* security */
	unsigned long stack_canary;

	/* creds */
	struct gb_cred_data real_cred;

	/* scheduler */
	struct gb_sched_data sched;

	/* memory */
	struct gb_memory_data mem;

} __attribute__((aligned(8)));

struct gb_taskview *gb_taskview_get(struct gb_task_key key);
void gb_taskview_free(struct gb_taskview *taskview);

#endif /* GB_TASKVIEW_H */
