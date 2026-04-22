#include "gb_netlink.h"
#include <linux/module.h>

MODULE_LICENSE("GPL");
MODULE_AUTHOR("Vasiko Vazagaevi");
MODULE_DESCRIPTION("Glassbox Kernel Module");

static int __init ps_init(void)
{
	return gb_netlink_init();
}

static void __exit ps_exit(void)
{
	gb_netlink_exit();
}

module_init(ps_init);
module_exit(ps_exit);
