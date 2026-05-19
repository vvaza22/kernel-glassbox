#include "gb_model.h"
#include "gb_vmexplorer.h"
#include "gb_netlink.h"
#include "gb_nl_vmexplorer.h"
#include "linux/netlink.h"
#include "linux/printk.h"
#include <linux/bug.h>
#include <linux/netlink.h>
#include <linux/sched/cputime.h>
#include <net/genetlink.h>

const struct nla_policy gb_nl_vme_dump_pol[GB_NL_ATTR_MAX + 1] = {
	[GB_NL_ATTR_VME_PGD_INDEX] = { .type = NLA_S32 },
	[GB_NL_ATTR_VME_PUD_INDEX] = { .type = NLA_S32 },
	[GB_NL_ATTR_VME_PMD_INDEX] = { .type = NLA_S32 },
	[GB_NL_ATTR_VME_PTE_INDEX] = { .type = NLA_S32 },
	[GB_NL_ATTR_VME_PID] = { .type = NLA_U32 },
	[GB_NL_ATTR_VME_START_TIME] = { .type = NLA_U64 },
};

static bool gb_nl_vme_populate_args(struct nlattr **attrs,
				    struct gb_vme_path *path,
				    struct gb_task_key *key)
{
	if (!attrs[GB_NL_ATTR_VME_PGD_INDEX] ||
	    !attrs[GB_NL_ATTR_VME_PUD_INDEX] ||
	    !attrs[GB_NL_ATTR_VME_PMD_INDEX] ||
	    !attrs[GB_NL_ATTR_VME_PTE_INDEX] || !attrs[GB_NL_ATTR_VME_PID] ||
	    !attrs[GB_NL_ATTR_VME_START_TIME]) {
		return false;
	}

	path->gb_vme_pgd_index = nla_get_s32(attrs[GB_NL_ATTR_VME_PGD_INDEX]);
	path->gb_vme_pud_index = nla_get_s32(attrs[GB_NL_ATTR_VME_PUD_INDEX]);
	path->gb_vme_pmd_index = nla_get_s32(attrs[GB_NL_ATTR_VME_PMD_INDEX]);
	path->gb_vme_pte_index = nla_get_s32(attrs[GB_NL_ATTR_VME_PTE_INDEX]);
	key->pid = nla_get_u32(attrs[GB_NL_ATTR_VME_PID]);
	key->start_time = nla_get_u64(attrs[GB_NL_ATTR_VME_START_TIME]);

	return true;
}

static bool gb_nl_vme_put_entry(struct sk_buff *skb,
				struct netlink_callback *cb,
				struct gb_vme_entry *entry)
{
	void *hdr;

	hdr = genlmsg_put(skb, NETLINK_CB(cb->skb).portid, cb->nlh->nlmsg_seq,
			  &gb_genl_family, NLM_F_MULTI, GB_NL_CMD_VME_DUMP);
	if (!hdr)
		return false;

	if (nla_put(skb, GB_NL_ATTR_VME_ENTRY, sizeof(*entry), entry)) {
		genlmsg_cancel(skb, hdr);
		return false;
	}

	genlmsg_end(skb, hdr);

	return true;
}

int gb_nl_vme_dump_start(struct netlink_callback *cb)
{
	const struct genl_dumpit_info *info = genl_dumpit_info(cb);
	struct gb_nl_vme_dump_ctx *ctx;
	struct gb_task_key key;
	struct gb_vme_path path;
	struct gb_vme *vme;
	int i;

	NL_ASSERT_DUMP_CTX_FITS(struct gb_nl_vme_dump_ctx);
	ctx = (struct gb_nl_vme_dump_ctx *)cb->ctx;
	ctx->vme = NULL;
	ctx->index = 0;

	if (!info || !info->info.attrs)
		return -EINVAL;

	if (!gb_nl_vme_populate_args(info->info.attrs, &path, &key)) {
		pr_err("%s: Invalid attributes\n", __func__);
		return -EINVAL;
	}

	vme = gb_vme_get(key, path);
	if (IS_ERR(vme)) {
		pr_err("%s: Failed to get vme. Error: %ld\n", __func__,
		       PTR_ERR(vme));
		return PTR_ERR(vme);
	}
	BUG_ON(!vme);

	pr_info("%s: Dumping VME for task (%d, %llu), path PGD[%d]->PUD[%d]->PMD[%d]->PTE[%d]\n",
		__func__, key.pid, key.start_time, path.gb_vme_pgd_index,
		path.gb_vme_pud_index, path.gb_vme_pmd_index,
		path.gb_vme_pte_index);

	for (i = 0; i < GB_VME_NUM_ENTRIES; i++) {
		struct gb_vme_entry *entry = &vme->entries[i];
		pr_info("%s: Entry %d: value=%016llx, pa=%016llx, kernel_va=%016llx, user_va=%016llx, bad=%d, leaf=%d\n",
			__func__, i, entry->value, entry->pa, entry->kernel_va,
			entry->user_va, entry->bad, entry->leaf);
	}

	ctx->vme = vme;
	return 0;
}

int gb_nl_vme_dump(struct sk_buff *skb, struct netlink_callback *cb)
{
	struct gb_nl_vme_dump_ctx *ctx = (struct gb_nl_vme_dump_ctx *)cb->ctx;
	struct gb_vme *vme = ctx->vme;
	int index_start = ctx->index;

	if (!vme)
		return 0;

	while (ctx->index < GB_VME_NUM_ENTRIES) {
		if (!gb_nl_vme_put_entry(skb, cb, &vme->entries[ctx->index]))
			break;
		ctx->index++;
	}

	pr_info("%s: Dumping VME from index %d to %d\n", __func__, index_start,
		ctx->index);

	return skb->len;
}

int gb_nl_vme_dump_done(struct netlink_callback *cb)
{
	struct gb_nl_vme_dump_ctx *ctx = (struct gb_nl_vme_dump_ctx *)cb->ctx;

	gb_vme_free(ctx->vme);

	return 0;
}
