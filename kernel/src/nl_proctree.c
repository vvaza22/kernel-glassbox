#include "gb_model.h"
#include "gb_netlink.h"
#include "gb_nl_proctree.h"
#include "gb_proctree.h"
#include <linux/netlink.h>
#include <net/genetlink.h>

int gb_proctree_dump_start(struct netlink_callback *cb)
{
	struct gb_nl_proctree_dump_ctx *ctx;
	struct gb_proctree *tree;

	NL_ASSERT_DUMP_CTX_FITS(struct gb_nl_proctree_dump_ctx);

	ctx = (struct gb_nl_proctree_dump_ctx *)cb->ctx;
	ctx->tree = NULL;
	ctx->index = 0;

	tree = gb_proctree_get();
	if (IS_ERR(tree)) {
		return PTR_ERR(tree);
	}

	pr_info("Proctree dump: %zu nodes%s\n", tree->num_nodes,
		tree->truncated ? " (truncated)" : "");

	ctx->tree = tree;

	return 0;
}

int gb_proctree_dump(struct sk_buff *skb, struct netlink_callback *cb)
{
	struct gb_nl_proctree_dump_ctx *ctx =
		(struct gb_nl_proctree_dump_ctx *)cb->ctx;
	struct gb_proctree *tree = ctx->tree;

	if (!tree)
		return 0;

	while (ctx->index < tree->num_nodes) {
		struct gb_proctree_node *node;
		void *hdr;

		node = &tree->nodes[ctx->index];
		hdr = genlmsg_put(skb, NETLINK_CB(cb->skb).portid,
				  cb->nlh->nlmsg_seq, &gb_genl_family,
				  NLM_F_MULTI, GB_CMD_PROCTREE_DUMP);
		if (!hdr)
			break;

		if (nla_put(skb, GB_ATTR_PROCTREE_NODE, sizeof(*node), node)) {
			genlmsg_cancel(skb, hdr);
			break;
		}

		genlmsg_end(skb, hdr);

		ctx->index++;
	}

	return skb->len;
}

int gb_proctree_dump_done(struct netlink_callback *cb)
{
	struct gb_nl_proctree_dump_ctx *ctx =
		(struct gb_nl_proctree_dump_ctx *)cb->ctx;

	if (ctx->tree)
		gb_proctree_free(ctx->tree);

	return 0;
}
