#ifndef GB_NL_SCHEDHOOK_H
#define GB_NL_SCHEDHOOK_H

#include "gb_schedhook.h"
#include <linux/netlink.h>
#include <net/genetlink.h>

struct gb_nl_schedhook_cap_ctx {
	struct gb_schedhook_cap *cap;
	u32 index;
};

int gb_nl_schedhook_cap_start(struct sk_buff *skb, struct genl_info *info);
int gb_nl_schedhook_dump_start(struct netlink_callback *cb);
int gb_nl_schedhook_dump(struct sk_buff *skb, struct netlink_callback *cb);
int gb_nl_schedhook_dump_done(struct netlink_callback *cb);

#endif /* GB_NL_SCHEDHOOK_H */
