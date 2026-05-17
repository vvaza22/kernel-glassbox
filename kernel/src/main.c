#include "gb_netlink.h"
#include "gb_vmexplorer.h"
#include <linux/module.h>

MODULE_IMPORT_NS(EXPORTED_FOR_KUNIT_TESTING);
MODULE_LICENSE("GPL");
MODULE_AUTHOR("Vasiko Vazagaevi");
MODULE_DESCRIPTION("Glassbox Kernel Module");

static int __init gb_init(void)
{
	int ret;

	if ((ret = gb_vme_sanity_check()))
		return ret;

	return gb_netlink_init();
}

static void __exit gb_exit(void)
{
	gb_netlink_exit();
}

module_init(gb_init);
module_exit(gb_exit);
