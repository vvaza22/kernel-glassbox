#ifndef GB_NL_TASKVIEW_H
#define GB_NL_TASKVIEW_H

#include "gb_netlink.h"
#include <linux/netlink.h>
#include <net/genetlink.h>

extern const struct nla_policy gb_nl_taskview_get_pol[GB_ATTR_MAX + 1];

int gb_nl_taskview_get(struct sk_buff *skb, struct genl_info *info);

#endif /* GB_NL_TASKVIEW_H */
