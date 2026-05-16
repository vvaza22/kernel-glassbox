#ifndef GB_NL_PROCTREE_H
#define GB_NL_PROCTREE_H

#include <linux/netlink.h>
#include <linux/types.h>

int gb_nl_proctree_dump_start(struct netlink_callback *cb);
int gb_nl_proctree_dump(struct sk_buff *skb, struct netlink_callback *cb);
int gb_nl_proctree_dump_done(struct netlink_callback *cb);

struct gb_nl_proctree_dump_ctx {
	struct gb_proctree *tree;
	u32 index;
};

#endif /* GB_NL_PROCTREE_H */