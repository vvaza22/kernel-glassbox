#include "gb_netlink.h"
#include "gb_nl_taskview.h"
#include "gb_taskview.h"
#include <linux/bug.h>
#include <linux/netlink.h>
#include <linux/sched/cputime.h>
#include <net/genetlink.h>

const struct nla_policy gb_nl_taskview_get_pol[GB_ATTR_MAX + 1] = {
	[GB_ATTR_TASKVIEW_PID] = { .type = NLA_U32 },
	[GB_ATTR_TASKVIEW_START_TIME] = { .type = NLA_U64 },
};

static int gb_nl_taskview_reply(struct gb_taskview *data,
				struct genl_info *info)
{
	struct sk_buff *skb;
	void *hdr;
	int ret;

	/* ensure my data does not exceed the safe size */
	BUILD_BUG_ON(sizeof(*data) > NLMSG_DEFAULT_SIZE);

	skb = genlmsg_new(NLMSG_DEFAULT_SIZE, GFP_KERNEL);
	if (!skb) {
		pr_err("%s: Failed to allocate skb\n", __func__);
		return -ENOMEM;
	}

	hdr = genlmsg_put_reply(skb, info, &gb_genl_family, 0,
				GB_CMD_TASKVIEW_GET);
	if (!hdr) {
		pr_err("%s: Failed to add genl header\n", __func__);
		nlmsg_free(skb);
		return -EMSGSIZE;
	}

	ret = nla_put(skb, GB_ATTR_TASKVIEW_DATA, sizeof(*data), data);
	if (ret) {
		pr_err("%s: Failed to add data\n", __func__);
		genlmsg_cancel(skb, hdr);
		nlmsg_free(skb);
		return ret;
	}

	genlmsg_end(skb, hdr);
	return genlmsg_reply(skb, info);
}

int gb_nl_taskview_get(struct sk_buff *skb, struct genl_info *info)
{
	/* request */
	struct gb_task_key req;

	/* response data */
	struct gb_taskview *data;
	int res;

	if (!info->attrs[GB_ATTR_TASKVIEW_PID] ||
	    !info->attrs[GB_ATTR_TASKVIEW_START_TIME]) {
		pr_err("%s: Invalid attributes\n", __func__);
		return -EINVAL;
	}

	req.pid = nla_get_u32(info->attrs[GB_ATTR_TASKVIEW_PID]);
	req.start_time = nla_get_u64(info->attrs[GB_ATTR_TASKVIEW_START_TIME]);
	pr_info("%s: (%d, %llu)\n", __func__, req.pid, req.start_time);

	data = gb_taskview_get(req);
	if (IS_ERR(data)) {
		/* I expect that common error will be -ESRCH */
		pr_err("%s: Failed (%d, %llu): %ld\n", __func__, req.pid,
		       req.start_time, PTR_ERR(data));

		return PTR_ERR(data);
	}

	res = gb_nl_taskview_reply(data, info);

	gb_taskview_free(data);

	return res;
}
