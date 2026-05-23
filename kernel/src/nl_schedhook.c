#include "gb_netlink.h"
#include "gb_schedhook.h"
#include "gb_nl_schedhook.h"
#include <linux/netlink.h>
#include <net/genetlink.h>

static bool _gb_nl_schedhook_put_data(struct sk_buff *skb,
				      struct netlink_callback *cb,
				      struct gb_schedhook_data_switch *data)
{
	void *hdr;

	hdr = genlmsg_put(skb, NETLINK_CB(cb->skb).portid, cb->nlh->nlmsg_seq,
			  &gb_genl_family, NLM_F_MULTI,
			  GB_NL_CMD_SCHEDHOOK_CAP);
	if (!hdr)
		return false;

	if (nla_put(skb, GB_NL_ATTR_SCHEDHOOK_DATA, sizeof(*data), data)) {
		genlmsg_cancel(skb, hdr);
		return false;
	}

	genlmsg_end(skb, hdr);

	return true;
}

// static bool _gb_nl_schedhook_put_hdr(struct sk_buff *skb,
// 				     struct netlink_callback *cb,
// 				     struct gb_schedhook_cap *cap)
// {
// 	void *hdr;

// 	hdr = genlmsg_put(skb, NETLINK_CB(cb->skb).portid, cb->nlh->nlmsg_seq,
// 			  &gb_genl_family, NLM_F_MULTI,
// 			  GB_NL_CMD_SCHEDHOOK_CAP);
// 	if (!hdr)
// 		return false;

// 	if (nla_put_u32(skb, GB_NL_ATTR_SCHEDHOOK_TIME_LEFT, cap->time_left) ||
// 	    nla_put_u32(skb, GB_NL_ATTR_SCHEDHOOK_TOTAL_CPUS,
// 			cap->total_cpus) ||
// 	    nla_put_u32(skb, GB_NL_ATTR_SCHEDHOOK_DONE_CPUS, cap->done_cpus) ||
// 	    nla_put_u32(skb, GB_NL_ATTR_SCHEDHOOK_NUM_SWITCHES,
// 			cap->num_switches)) {
// 		genlmsg_cancel(skb, hdr);
// 		return false;
// 	}

// 	genlmsg_end(skb, hdr);

// 	return true;
// }

int gb_nl_schedhook_dump_start(struct netlink_callback *cb)
{
	struct gb_nl_schedhook_cap_ctx *ctx;
	struct gb_schedhook_cap *cap;
	int ret;

	NL_ASSERT_DUMP_CTX_FITS(struct gb_nl_schedhook_cap_ctx);
	ctx = (struct gb_nl_schedhook_cap_ctx *)cb->ctx;
	ctx->index = 0;
	ctx->cap = NULL;
	ctx->hdr_sent = false;

	ret = gb_schedhook_cap_start();
	if (ret) {
		pr_err("%s: Failed to start cap: %d\n", __func__, ret);
		return ret;
	}
	pr_info("%s: CAP Start OK\n", __func__);

	cap = gb_schedhook_cap_wait();
	if (IS_ERR(cap)) {
		ret = PTR_ERR(cap);
		pr_err("%s: Failed to get cap: %d\n", __func__, ret);
		return ret;
	}
	pr_info("%s: CAP Wait OK\n", __func__);
	pr_info("%s: time_left=%d\n", __func__, cap->time_left);
	pr_info("%s: total_cpus=%d\n", __func__, cap->total_cpus);
	pr_info("%s: done_cpus=%d\n", __func__, cap->done_cpus);
	pr_info("%s: num_switches=%d\n", __func__, cap->num_switches);
	ctx->cap = cap;

	return 0;
}

int gb_nl_schedhook_dump(struct sk_buff *skb, struct netlink_callback *cb)
{
	struct gb_nl_schedhook_cap_ctx *ctx =
		(struct gb_nl_schedhook_cap_ctx *)cb->ctx;
	struct gb_schedhook_cap *cap = ctx->cap;
	int index_start = ctx->index;

	if (!cap)
		return 0;

	while (ctx->index < cap->num_switches) {
		if (!_gb_nl_schedhook_put_data(skb, cb, &cap->data[ctx->index]))
			break;
		ctx->index++;
	}

	pr_info("%s: Dumping CAP from index %d to %d\n", __func__, index_start,
		ctx->index);

	return skb->len;
}

int gb_nl_schedhook_dump_done(struct netlink_callback *cb)
{
	struct gb_nl_schedhook_cap_ctx *ctx =
		(struct gb_nl_schedhook_cap_ctx *)cb->ctx;

	gb_schedhook_cap_free(ctx->cap);

	/* Allow new captures */
	gb_schedhook_cap_finish();
	pr_info("%s: CAP Finish OK\n", __func__);

	return 0;
}
