#include "gb_netlink.h"
#include "gb_nl_proctree.h"
#include "gb_nl_taskview.h"
#include <linux/netlink.h>
#include <net/genetlink.h>

static const struct genl_ops gb_genl_ops[] = {
	{
		.cmd = GB_NL_CMD_PROCTREE_DUMP,
		.start = gb_nl_proctree_dump_start,
		.dumpit = gb_nl_proctree_dump,
		.done = gb_nl_proctree_dump_done,
	},
	{
		.cmd = GB_NL_CMD_TASKVIEW_GET,
		.doit = gb_nl_taskview_get,
		.policy = gb_nl_taskview_get_pol,
		.maxattr = GB_NL_ATTR_MAX,
	}
};

struct genl_family gb_genl_family = {
	.name = GB_GENL_FAMILY_NAME,
	.version = 1,
	.maxattr = GB_NL_ATTR_MAX,
	.module = THIS_MODULE,
	.ops = gb_genl_ops,
	.n_ops = ARRAY_SIZE(gb_genl_ops),
};

int gb_netlink_init(void)
{
	int res;

	res = genl_register_family(&gb_genl_family);
	if (res != 0) {
		pr_err("%s: Failed to register genl family: %d\n", __func__,
		       res);
		return res;
	}
	return 0;
}

void gb_netlink_exit(void)
{
	genl_unregister_family(&gb_genl_family);
}
