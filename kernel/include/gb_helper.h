#ifndef GB_HELPER_H
#define GB_HELPER_H

#include "gb_model.h"
#include <linux/sched.h>

/**
 * gb_find_get_task - find + get(increment refcount) task_struct by gb_task_key
 * caller should call put_task_struct() after use.
 */
struct task_struct *gb_find_get_task(struct gb_task_key key);

#endif /* GB_HELPER_H */
