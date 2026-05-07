#include "gb_netlink.h"
#include "gb_nl_taskview.h"
#include "gb_taskview.h"
#include <linux/bug.h>
#include <linux/netlink.h>
#include <net/genetlink.h>

const struct nla_policy gb_nl_taskview_req_policy[GB_ATTR_MAX + 1] = {
	[GB_ATTR_TASKVIEW_PID] = { .type = NLA_U32 },
	[GB_ATTR_TASKVIEW_START_TIME] = { .type = NLA_U64 },
};

int gb_taskview_req(struct sk_buff *skb, struct genl_info *info)
{
	// request
	struct gb_task_key req;

	// response data
	struct gb_taskview *data;

	// response structures
	struct sk_buff *resp_skb;
	void *resp_head;
	int res;

	if (!info->attrs[GB_ATTR_TASKVIEW_PID] ||
	    !info->attrs[GB_ATTR_TASKVIEW_START_TIME]) {
		return -EINVAL;
	}

	req.pid = nla_get_u32(info->attrs[GB_ATTR_TASKVIEW_PID]);
	req.start_time = nla_get_u64(info->attrs[GB_ATTR_TASKVIEW_START_TIME]);
	pr_info("gb_taskview_req: PID %d, start_time %llu\n", req.pid,
		req.start_time);

	data = gb_taskview_get(req);
	if (IS_ERR(data)) {
		pr_err("gb_taskview_req: Failed to get taskview data PID %d, start_time %llu: %ld\n",
		       req.pid, req.start_time, PTR_ERR(data));
		return PTR_ERR(data);
	}

	resp_skb = genlmsg_new(NLMSG_DEFAULT_SIZE, GFP_KERNEL);
	if (!resp_skb) {
		pr_err("gb_taskview_req: Failed to allocate response skb\n");
		gb_taskview_free(data);
		return -ENOMEM;
	}

	resp_head = genlmsg_put_reply(resp_skb, info, &gb_genl_family, 0,
				      GB_CMD_TASKVIEW_REQ);
	if (!resp_head) {
		pr_err("gb_taskview_req: Failed to put response head\n");
		nlmsg_free(resp_skb);
		gb_taskview_free(data);
		return -EMSGSIZE;
	}

	// ensure my data does not exceed the safe size
	BUILD_BUG_ON(sizeof(*data) > NLMSG_DEFAULT_SIZE);

	if (nla_put(resp_skb, GB_ATTR_TASKVIEW_DATA, sizeof(*data), data)) {
		pr_err("gb_taskview_req: Failed to put taskview data\n");
		genlmsg_cancel(resp_skb, resp_head);
		gb_taskview_free(data);
		return -EMSGSIZE;
	}

	genlmsg_end(resp_skb, resp_head);
	res = genlmsg_reply(resp_skb, info);

	// cleanup
	gb_taskview_free(data);

	return res;
}
