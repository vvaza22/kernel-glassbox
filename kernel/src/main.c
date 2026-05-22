#include "gb_schedhook.h"
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

	if ((ret = gb_schedhook_init()))
		return ret;

	if ((ret = gb_netlink_init()))
		goto netlink_fail;

	return 0;

netlink_fail:
	gb_schedhook_exit();
	return ret;
}

static void __exit gb_exit(void)
{
	/* Remove netlink first to prevent new requests */
	gb_netlink_exit();
	gb_schedhook_exit();
}

module_init(gb_init);
module_exit(gb_exit);
