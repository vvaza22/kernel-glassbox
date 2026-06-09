#ifndef GB_PROCTREE_H
#define GB_PROCTREE_H

#include "gb_model.h"
#include <linux/types.h>
#include <linux/sched.h>

#define GB_PROCTREE_MAX_NODES 1000

struct gb_proctree_node {
	struct gb_task_key parent;
	struct gb_task_key real_parent;
	struct gb_task_key group_leader;
	struct gb_task_key self;
	char name[TASK_COMM_LEN];
	bool is_kthread;
};

struct gb_proctree {
	struct gb_proctree_node *nodes;
	size_t num_nodes;
	size_t capacity;
	bool truncated;
};

struct gb_proctree *gb_proctree_get(void);
void gb_proctree_free(struct gb_proctree *tree);

#endif /* GB_PROCTREE_H */
