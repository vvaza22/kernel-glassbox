#include <linux/err.h>
#include <linux/sched.h>
#include <linux/sched/signal.h>
#include <linux/slab.h>

#include "gb_model.h"
#include "gb_proctree.h"

static void gb_proctree_read_task(struct gb_proctree_node *node,
				  struct task_struct *group_leader,
				  struct task_struct *task)
{
	struct task_struct *parent;
	struct task_struct *real_parent;

	RCU_LOCKDEP_WARN(
		!rcu_read_lock_held(),
		"gb_proctree_read_task() requires rcu_read_lock() protection");

	parent = rcu_dereference(task->parent);
	real_parent = rcu_dereference(task->real_parent);

	/* parent */
	node->parent.pid = 0;
	node->parent.start_time = 0;
	if (parent) {
		node->parent.pid = parent->pid;
		node->parent.start_time = parent->start_time;
	}

	/* real parent */
	node->real_parent.pid = 0;
	node->real_parent.start_time = 0;
	if (real_parent) {
		node->real_parent.pid = real_parent->pid;
		node->real_parent.start_time = real_parent->start_time;
	}

	/* group leader */
	node->group_leader.pid = group_leader->pid;
	node->group_leader.start_time = group_leader->start_time;

	/* self */
	node->self.pid = task->pid;
	node->self.start_time = task->start_time;

	/* task name */
	get_task_comm(node->name, task);
}

static void gb_proctree_read_tasks(struct gb_proctree *tree)
{
	struct task_struct *process, *thread;

	rcu_read_lock();
	for_each_process_thread(process, thread) {
		if (tree->num_nodes >= tree->capacity) {
			pr_warn("Reached maximum capacity of process tree, truncating...\n");
			tree->truncated = true;
			break;
		}
		gb_proctree_read_task(&tree->nodes[tree->num_nodes++], process,
				      thread);
	}
	rcu_read_unlock();
}

struct gb_proctree *gb_proctree_get(void)
{
	struct gb_proctree *tree;

	tree = kmalloc(sizeof(*tree), GFP_KERNEL);
	if (!tree)
		return ERR_PTR(-ENOMEM);

	tree->capacity = GB_PROCTREE_MAX_NODES;
	tree->num_nodes = 0;
	tree->truncated = false;
	/* TODO: Optimize memory usage by allocating only the required number of nodes */
	tree->nodes = kmalloc_array(
		tree->capacity, sizeof(struct gb_proctree_node), GFP_KERNEL);
	if (!tree->nodes) {
		pr_err("Failed to allocate memory for process tree nodes\n");
		kfree(tree);
		return ERR_PTR(-ENOMEM);
	}

	gb_proctree_read_tasks(tree);

	return tree;
}

void gb_proctree_free(struct gb_proctree *tree)
{
	if (!tree)
		return;
	kfree(tree->nodes);
	tree->nodes = NULL;
	kfree(tree);
}
