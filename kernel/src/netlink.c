#include "gb_netlink.h"
#include "gb_nl_proctree.h"
#include <linux/netlink.h>
#include <net/genetlink.h>

static const struct genl_ops gb_genl_ops[] = {
	{
		.cmd = GB_CMD_PROCTREE_DUMP,
		.start = gb_proctree_dump_start,
		.dumpit = gb_proctree_dump,
		.done = gb_proctree_dump_done,
	},
};

struct genl_family gb_genl_family = {
	.name = GB_FAMILY_NAME,
	.version = 1,
	.maxattr = GB_ATTR_MAX,
	.module = THIS_MODULE,
	.ops = gb_genl_ops,
	.n_ops = ARRAY_SIZE(gb_genl_ops),
};

int gb_netlink_init(void)
{
	int res;

	res = genl_register_family(&gb_genl_family);
	if (res != 0) {
		pr_err("Failed to register Generic Netlink family: %d\n", res);
		return res;
	}
	return 0;
}

void gb_netlink_exit(void)
{
	genl_unregister_family(&gb_genl_family);
}
