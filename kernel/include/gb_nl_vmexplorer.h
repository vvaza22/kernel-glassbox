#ifndef GB_NL_VMEXPLORER_H
#define GB_NL_VMEXPLORER_H

#include "gb_netlink.h"
#include <linux/netlink.h>
#include <net/genetlink.h>

extern const struct nla_policy gb_nl_vme_dump_pol[GB_NL_ATTR_MAX + 1];

int gb_nl_vme_dump_start(struct netlink_callback *cb);
int gb_nl_vme_dump(struct sk_buff *skb, struct netlink_callback *cb);
int gb_nl_vme_dump_done(struct netlink_callback *cb);

struct gb_nl_vme_dump_ctx {
	struct gb_vme *vme;
	u32 index;
};

#endif /* GB_NL_VMEXPLORER_H */
