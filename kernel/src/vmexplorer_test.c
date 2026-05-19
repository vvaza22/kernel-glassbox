#include "gb_vmexplorer.h"
#include <asm/pgtable.h>
#include <asm/pgtable_64_types.h>
#include <asm/pgtable_types.h>
#include <linux/mm_types.h>
#include <kunit/test.h>
#include <linux/sched/mm.h>

/*
TODO: Improve tests with more high-level linux functions,
will need update after per-pagetable locks are implemented
TODO: Add free
*/

struct gb_test_vme_fill_ctx {
	struct mm_struct *mm;
	pgd_t *pgd_base;
	pud_t *pud0_base;
	pud_t *pud1_base;
	pmd_t *pmd00_base;
	pte_t *pte000_base;
	void *page0001;
	void *hugepage002;
	/* Note: I don't actually allocate 1GB page, but simple 4KB one */
	void *gigapage10;
};

static void gb_test_vme_fill_ctx_free(struct gb_test_vme_fill_ctx *ctx)
{
	if (!ctx)
		return;
	mmdrop(ctx->mm);
	free_page((unsigned long)ctx->pud0_base);
	free_page((unsigned long)ctx->pud1_base);
	free_page((unsigned long)ctx->pmd00_base);
	free_page((unsigned long)ctx->pte000_base);
	free_page((unsigned long)ctx->page0001);
	free_pages((unsigned long)ctx->hugepage002, 9);
	free_page((unsigned long)ctx->gigapage10);
}

static int gb_test_vme_fill_init(struct kunit *test)
{
	struct gb_test_vme_fill_ctx *ctx;

	ctx = kunit_kzalloc(test, sizeof(*ctx), GFP_KERNEL);
	if (!ctx) {
		return -ENOMEM;
	}

	/* mm_alloc: https://elixir.bootlin.com/linux/v6.12.74/source/kernel/fork.c#L1333 */
	ctx->mm = mm_alloc();
	if (!ctx->mm)
		goto mm_fail;
	kunit_info(test, "mm=%px", ctx->mm);

	ctx->pgd_base = READ_ONCE(ctx->mm->pgd);
	kunit_info(test, "pgd_base=%px", (void *)ctx->pgd_base);

	/* PGD[0] = PUD 0 */
	/* __get_free_page: https://elixir.bootlin.com/linux/v6.12.74/source/include/linux/gfp.h#L365 */
	ctx->pud0_base = (pud_t *)__get_free_page(GFP_KERNEL | __GFP_ZERO);
	if (!ctx->pud0_base)
		goto pud0_fail;
	kunit_info(test, "pud0_base(va)=%px, pud0_base(pa)=%px",
		   (void *)ctx->pud0_base, (void *)__pa(ctx->pud0_base));
	set_pgd(&ctx->mm->pgd[0], __pgd(_PAGE_TABLE | __pa(ctx->pud0_base)));

	/* PGD[1] = PUD 1 */
	ctx->pud1_base = (pud_t *)__get_free_page(GFP_KERNEL | __GFP_ZERO);
	if (!ctx->pud1_base)
		goto pud1_fail;
	kunit_info(test, "pud1_base(va)=%px, pud1_base(pa)=%px",
		   (void *)ctx->pud1_base, (void *)__pa(ctx->pud1_base));
	set_pgd(&ctx->mm->pgd[1], __pgd(_PAGE_TABLE | __pa(ctx->pud1_base)));

	/* PGD[0][0] = PMD00 */
	ctx->pmd00_base = (pmd_t *)__get_free_page(GFP_KERNEL | __GFP_ZERO);
	if (!ctx->pmd00_base)
		goto pmd00_fail;
	kunit_info(test, "pmd00_base(va)=%px, pmd00_base(pa)=%px",
		   (void *)ctx->pmd00_base, (void *)__pa(ctx->pmd00_base));
	set_pud(&ctx->pud0_base[0], __pud(_PAGE_TABLE | __pa(ctx->pmd00_base)));

	/* PGD[0][0][0] = PTE000 */
	ctx->pte000_base = (pte_t *)__get_free_page(GFP_KERNEL | __GFP_ZERO);
	if (!ctx->pte000_base)
		goto pte000_fail;
	kunit_info(test, "pte000_base(va)=%px, pte000_base(pa)=%px",
		   (void *)ctx->pte000_base, (void *)__pa(ctx->pte000_base));
	set_pmd(&ctx->pmd00_base[0],
		__pmd(_PAGE_TABLE | __pa(ctx->pte000_base)));

	/* PGD[0][0][0][1] = PAGE0001 */
	ctx->page0001 = (void *)__get_free_page(GFP_KERNEL | __GFP_ZERO);
	if (!ctx->page0001)
		goto page0001_fail;
	kunit_info(test, "page0001(va)=%px, page0001(pa)=%px", ctx->page0001,
		   (void *)__pa(ctx->page0001));
	set_pte(&ctx->pte000_base[1], __pte(_PAGE_PRESENT | _PAGE_RW |
					    _PAGE_USER | __pa(ctx->page0001)));

	/* PGD[0][0][2] = HUGEPAGE002 (2MB, order=9) */
	ctx->hugepage002 = (void *)__get_free_pages(GFP_KERNEL | __GFP_ZERO, 9);
	if (!ctx->hugepage002)
		goto hugepage002_fail;
	kunit_info(test, "hugepage002(va)=%px, hugepage002(pa)=%px",
		   ctx->hugepage002, (void *)__pa(ctx->hugepage002));
	set_pmd(&ctx->pmd00_base[2],
		__pmd(_PAGE_PRESENT | _PAGE_RW | _PAGE_USER |
		      __pa(ctx->hugepage002) | _PAGE_PSE));

	/* PGD[1][0] = GIGAPAGE10 (not actually 1GB) */
	ctx->gigapage10 = (void *)__get_free_page(GFP_KERNEL | __GFP_ZERO);
	if (!ctx->gigapage10)
		goto gigapage10_fail;
	kunit_info(test, "gigapage10(va)=%px, gigapage10(pa)=%px",
		   ctx->gigapage10, (void *)__pa(ctx->gigapage10));
	set_pud(&ctx->pud1_base[0],
		__pud(_PAGE_PRESENT | _PAGE_RW | _PAGE_USER |
		      __pa(ctx->gigapage10) | _PAGE_PSE));

	test->priv = ctx;
	return 0;

gigapage10_fail:
	free_page((unsigned long)ctx->gigapage10);
hugepage002_fail:
	free_page((unsigned long)ctx->page0001);
page0001_fail:
	free_page((unsigned long)ctx->pte000_base);
pte000_fail:
	free_page((unsigned long)ctx->pmd00_base);
pmd00_fail:
	free_page((unsigned long)ctx->pud1_base);
pud1_fail:
	free_page((unsigned long)ctx->pud0_base);
pud0_fail:
	mmdrop(ctx->mm);
mm_fail:
	test->priv = NULL;
	return -ENOMEM;
}

static void gb_test_vme_fill_exit(struct kunit *test)
{
	struct gb_test_vme_fill_ctx *ctx = test->priv;
	gb_test_vme_fill_ctx_free(ctx);
	test->priv = NULL;
}

static void gb_test_vme_fill__pgd_table(struct kunit *test)
{
	struct gb_test_vme_fill_ctx *ctx = test->priv;
	struct mm_struct *mm = ctx->mm;
	struct gb_vme *vme;
	struct gb_vme_path path;
	int res;
	pgdval_t t0, t1, t2;

	vme = kunit_kzalloc(test, sizeof(*vme), GFP_KERNEL);
	KUNIT_ASSERT_NOT_NULL(test, vme);
	kunit_info(test, "vme=%px", vme);

	path = (struct gb_vme_path){
		.pgd_index = GB_VME_UNSPEC_INDEX,
		.pud_index = GB_VME_UNSPEC_INDEX,
		.pmd_index = GB_VME_UNSPEC_INDEX,
		.pte_index = GB_VME_UNSPEC_INDEX,
	};
	KUNIT_ASSERT_TRUE(test, gb_vme_validate_path(path));
	t0 = pgd_val(ctx->pgd_base[0]);
	t1 = pgd_val(ctx->pgd_base[1]);
	t2 = pgd_val(ctx->pgd_base[2]);
	kunit_info(test, "pgd_base[0]=%px", (void *)t0);
	kunit_info(test, "pgd_base[1]=%px", (void *)t1);
	kunit_info(test, "pgd_base[2]=%px", (void *)t2);
	KUNIT_ASSERT_NE(test, t0, 0);
	KUNIT_ASSERT_NE(test, t1, 0);
	KUNIT_ASSERT_EQ(test, t2, 0);

	res = gb_vme_fill(vme, mm, path);
	KUNIT_ASSERT_EQ(test, res, 0);
	KUNIT_ASSERT_EQ(test, vme->entries[0].value, t0);
	KUNIT_ASSERT_EQ(test, vme->entries[1].value, t1);
	KUNIT_ASSERT_EQ(test, vme->entries[2].value, t2);
}

static void gb_test_vme_fill__pud_table(struct kunit *test)
{
	struct gb_test_vme_fill_ctx *ctx = test->priv;
	struct mm_struct *mm = ctx->mm;
	struct gb_vme *vme;
	struct gb_vme_path path;
	int res;
	pudval_t t0, t1, t2;

	vme = kunit_kzalloc(test, sizeof(*vme), GFP_KERNEL);
	KUNIT_ASSERT_NOT_NULL(test, vme);
	kunit_info(test, "vme=%px", vme);

	/* Explore PUD1 at PGD[1] */
	path = (struct gb_vme_path){
		.pgd_index = 1,
		.pud_index = GB_VME_UNSPEC_INDEX,
		.pmd_index = GB_VME_UNSPEC_INDEX,
		.pte_index = GB_VME_UNSPEC_INDEX,
	};
	KUNIT_ASSERT_TRUE(test, gb_vme_validate_path(path));
	t0 = pud_val(ctx->pud1_base[0]);
	t1 = pud_val(ctx->pud1_base[1]);
	t2 = pud_val(ctx->pud1_base[2]);
	kunit_info(test, "pud1_base[0]=%px", (void *)t0);
	kunit_info(test, "pud1_base[1]=%px", (void *)t1);
	kunit_info(test, "pud1_base[2]=%px", (void *)t2);
	KUNIT_ASSERT_NE(test, t0, 0);
	KUNIT_ASSERT_EQ(test, t1, 0);
	KUNIT_ASSERT_EQ(test, t2, 0);

	res = gb_vme_fill(vme, mm, path);
	KUNIT_ASSERT_EQ(test, res, 0);

	KUNIT_ASSERT_EQ(test, vme->entries[0].value, t0);
	KUNIT_ASSERT_TRUE(test, vme->entries[0].leaf);
	KUNIT_ASSERT_TRUE(test, vme->entries[0].bad);

	KUNIT_ASSERT_EQ(test, vme->entries[1].value, t1);
	KUNIT_ASSERT_EQ(test, vme->entries[2].value, t2);
}

static void gb_test_vme_fill__pmd_table(struct kunit *test)
{
	struct gb_test_vme_fill_ctx *ctx = test->priv;
	struct mm_struct *mm = ctx->mm;
	struct gb_vme *vme;
	struct gb_vme_path path;
	int res;
	pmdval_t t0, t1, t2;

	vme = kunit_kzalloc(test, sizeof(*vme), GFP_KERNEL);
	KUNIT_ASSERT_NOT_NULL(test, vme);
	kunit_info(test, "vme=%px", vme);

	/* Explore PMD00 at PGD[0][0] */
	path = (struct gb_vme_path){
		.pgd_index = 0,
		.pud_index = 0,
		.pmd_index = GB_VME_UNSPEC_INDEX,
		.pte_index = GB_VME_UNSPEC_INDEX,
	};
	KUNIT_ASSERT_TRUE(test, gb_vme_validate_path(path));
	t0 = pmd_val(ctx->pmd00_base[0]);
	t1 = pmd_val(ctx->pmd00_base[1]);
	t2 = pmd_val(ctx->pmd00_base[2]);
	kunit_info(test, "pmd00_base[0]=%px", (void *)t0);
	kunit_info(test, "pmd00_base[1]=%px", (void *)t1);
	kunit_info(test, "pmd00_base[2]=%px", (void *)t2);
	KUNIT_ASSERT_NE(test, t0, 0);
	KUNIT_ASSERT_EQ(test, t1, 0);
	KUNIT_ASSERT_NE(test, t2, 0);

	res = gb_vme_fill(vme, mm, path);
	KUNIT_ASSERT_EQ(test, res, 0);
	KUNIT_ASSERT_EQ(test, vme->entries[0].value, t0);
	KUNIT_ASSERT_EQ(test, vme->entries[1].value, t1);

	KUNIT_ASSERT_EQ(test, vme->entries[2].value, t2);
	KUNIT_ASSERT_TRUE(test, vme->entries[2].leaf);
	KUNIT_ASSERT_TRUE(test, vme->entries[2].bad);
}

static void gb_test_vme_fill__pte_table(struct kunit *test)
{
	struct gb_test_vme_fill_ctx *ctx = test->priv;
	struct mm_struct *mm = ctx->mm;
	struct gb_vme *vme;
	struct gb_vme_path path;
	int res;
	pteval_t t0, t1, t2;

	vme = kunit_kzalloc(test, sizeof(*vme), GFP_KERNEL);
	KUNIT_ASSERT_NOT_NULL(test, vme);
	kunit_info(test, "vme=%px", vme);

	/* Explore PTE000 at PGD[0][0][0] */
	path = (struct gb_vme_path){
		.pgd_index = 0,
		.pud_index = 0,
		.pmd_index = 0,
		.pte_index = GB_VME_UNSPEC_INDEX,
	};
	KUNIT_ASSERT_TRUE(test, gb_vme_validate_path(path));
	t0 = pte_val(ctx->pte000_base[0]);
	t1 = pte_val(ctx->pte000_base[1]);
	t2 = pte_val(ctx->pte000_base[2]);
	kunit_info(test, "pte000_base[0]=%px", (void *)t0);
	kunit_info(test, "pte000_base[1]=%px", (void *)t1);
	kunit_info(test, "pte000_base[2]=%px", (void *)t2);
	KUNIT_ASSERT_EQ(test, t0, 0);
	KUNIT_ASSERT_NE(test, t1, 0);
	KUNIT_ASSERT_EQ(test, t2, 0);

	res = gb_vme_fill(vme, mm, path);
	KUNIT_ASSERT_EQ(test, res, 0);
	KUNIT_ASSERT_EQ(test, vme->entries[0].value, t0);
	KUNIT_ASSERT_EQ(test, vme->entries[1].value, t1);
	KUNIT_ASSERT_EQ(test, vme->entries[2].value, t2);
}

static struct kunit_case gb_test_vme_fill[] = {
	KUNIT_CASE(gb_test_vme_fill__pgd_table),
	KUNIT_CASE(gb_test_vme_fill__pud_table),
	KUNIT_CASE(gb_test_vme_fill__pmd_table),
	KUNIT_CASE(gb_test_vme_fill__pte_table),
	{}
};

static struct kunit_suite gb_test_vme_fill_suite = {
	.name = "gb_test_vme_fill_suite",
	.test_cases = gb_test_vme_fill,
	.init = gb_test_vme_fill_init,
	.exit = gb_test_vme_fill_exit,
};

kunit_test_suite(gb_test_vme_fill_suite);
