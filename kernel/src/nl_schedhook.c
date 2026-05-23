#include "gb_netlink.h"
#include "gb_schedhook.h"
#include "gb_nl_schedhook.h"
#include <linux/netlink.h>
#include <net/genetlink.h>

static bool _gb_nl_schedhook_put_data(struct sk_buff *skb,
				      struct netlink_callback *cb,
				      struct gb_schedhook_event *data)
{
	void *hdr;

	hdr = genlmsg_put(skb, NETLINK_CB(cb->skb).portid, cb->nlh->nlmsg_seq,
			  &gb_genl_family, NLM_F_MULTI,
			  GB_NL_CMD_SCHEDHOOK_CAP_END);
	if (!hdr)
		return false;

	if (nla_put(skb, GB_NL_ATTR_SCHEDHOOK_EVENT, sizeof(*data), data)) {
		genlmsg_cancel(skb, hdr);
		return false;
	}

	genlmsg_end(skb, hdr);

	return true;
}

static int _gb_nl_schedhook_reply(struct genl_info *info)
{
	struct sk_buff *skb;
	void *hdr;

	skb = genlmsg_new(NLMSG_DEFAULT_SIZE, GFP_KERNEL);
	if (!skb) {
		pr_err("%s: Failed to allocate skb\n", __func__);
		return -ENOMEM;
	}

	hdr = genlmsg_put_reply(skb, info, &gb_genl_family, 0,
				GB_NL_CMD_SCHEDHOOK_CAP_END);
	if (!hdr) {
		pr_err("%s: Failed to add genl header\n", __func__);
		nlmsg_free(skb);
		return -EMSGSIZE;
	}

	genlmsg_end(skb, hdr);
	return genlmsg_reply(skb, info);
}

int gb_nl_schedhook_cap_start(struct sk_buff *skb, struct genl_info *info)
{
	int res;

	res = gb_schedhook_cap_start();
	if (res) {
		pr_err("%s: CAP_START Failed: %d\n", __func__, res);
		return res;
	}
	pr_info("%s: CAP_START OK\n", __func__);

	return _gb_nl_schedhook_reply(info);
}

int gb_nl_schedhook_dump_start(struct netlink_callback *cb)
{
	struct gb_nl_schedhook_cap_ctx *ctx;
	struct gb_schedhook_cap *cap;

	NL_ASSERT_DUMP_CTX_FITS(struct gb_nl_schedhook_cap_ctx);
	ctx = (struct gb_nl_schedhook_cap_ctx *)cb->ctx;
	ctx->index = 0;
	ctx->cap = NULL;

	pr_info("%s: CAP_END called\n", __func__);

	cap = gb_schedhook_cap_end();
	if (IS_ERR(cap)) {
		pr_err("%s: CAP_END Failed: %ld\n", __func__, PTR_ERR(cap));
		return PTR_ERR(cap);
	}

	pr_info("%s: CAP_END OK\n", __func__);
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

	while (ctx->index < cap->cnt) {
		if (!_gb_nl_schedhook_put_data(skb, cb,
					       &cap->events[ctx->index]))
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
	pr_info("%s: CAP Finish OK\n", __func__);

	return 0;
}
