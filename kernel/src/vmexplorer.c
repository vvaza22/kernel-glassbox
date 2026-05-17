#include "asm/pgtable_64_types.h"
#include "gb_helper.h"
#include "gb_vmexplorer.h"
#include <asm/pgtable.h>
#include <linux/sched.h>
#include <linux/sched/mm.h>
#include <linux/sched/task.h>
#include <linux/slab.h>
#include <kunit/visibility.h>

/* 
Possible flags for page table entries from linux source code:
https://elixir.bootlin.com/linux/v6.12.74/source/arch/x86/include/asm/pgtable_types.h#L10 
*/

int gb_vme_sanity_check(void)
{
#ifdef CONFIG_X86_PAE
/* https://elixir.bootlin.com/linux/v6.12.74/source/arch/x86/mm/pgtable.c#L367 */
#error "Physical Address Extension (PAE) is not supported"
#endif

	/* Make sure the current architecture has 512 entries on each level */
	BUILD_BUG_ON(GB_VME_NUM_ENTRIES != PTRS_PER_PTE);
	BUILD_BUG_ON(GB_VME_NUM_ENTRIES != PTRS_PER_PMD);
	BUILD_BUG_ON(GB_VME_NUM_ENTRIES != PTRS_PER_PUD);
	BUILD_BUG_ON(GB_VME_NUM_ENTRIES != PTRS_PER_PGD);

	/* Make sure the kernel only uses 4-level page tables */
	if (pgtable_l5_enabled()) {
		pr_err("%s: 5-level page tables are not supported\n", __func__);
		return -ENOTSUPP;
	} else {
		pr_info("%s: Using 4-level page tables\n", __func__);
	}

	return 0;
}

static void _gb_vme_fill_pgd(struct gb_vme *vme, pgd_t *pgd)
{
	for (int i = 0; i < PTRS_PER_PGD; i++) {
		pgd_t pgd_entry = READ_ONCE(pgd[i]);
		struct gb_vme_entry *vme_entry_ptr = &vme->entries[i];

		if (pgd_none(pgd_entry) || pgd_bad(pgd_entry)) {
			continue;
		}

		vme_entry_ptr->value = pgd_val(pgd_entry);
	}
}

static void _gb_vme_fill_pud(struct gb_vme *vme, pud_t *pud)
{
	for (int i = 0; i < PTRS_PER_PUD; i++) {
		pud_t pud_entry = READ_ONCE(pud[i]);
		struct gb_vme_entry *vme_entry_ptr = &vme->entries[i];

		if (pud_none(pud_entry) || pud_bad(pud_entry)) {
			continue;
		}

		vme_entry_ptr->value = pud_val(pud_entry);
	}
}

static void _gb_vme_fill_pmd(struct gb_vme *vme, pmd_t *pmd)
{
	for (int i = 0; i < PTRS_PER_PMD; i++) {
		pmd_t pmd_entry = READ_ONCE(pmd[i]);
		struct gb_vme_entry *vme_entry_ptr = &vme->entries[i];

		if (pmd_none(pmd_entry) || pmd_bad(pmd_entry)) {
			continue;
		}

		vme_entry_ptr->value = pmd_val(pmd_entry);
	}
}

static void _gb_vme_fill_pte(struct gb_vme *vme, pte_t *pte)
{
	for (int i = 0; i < PTRS_PER_PTE; i++) {
		pte_t pte_entry = READ_ONCE(pte[i]);
		struct gb_vme_entry *vme_entry_ptr = &vme->entries[i];

		if (pte_none(pte_entry)) {
			continue;
		}

		vme_entry_ptr->value = pte_val(pte_entry);
	}
}

/** 
 * pud_page_vaddr - Get virtual address of PUD entry
 *
 * Note: I had to implement this because kernel does not provide pud_page_vaddr()
 * I used the implementation of pgd_page_vaddr() as reference:
 * https://elixir.bootlin.com/linux/v6.12.74/source/arch/x86/include/asm/pgtable.h#L1190
 */
static inline unsigned long pud_page_vaddr(pud_t pud)
{
	return (unsigned long)__va(pud_val(pud) & pud_pfn_mask(pud));
}

static int _gb_vme_fill(struct gb_vme *vme, pgd_t *pgd_base,
			struct gb_vme_path path)
{
	/*
	TODO: Function is too big.
	TODO: Add huge table support, 2MB + 1GB.
	TODO: Add swapped out entry support.
	*/
	pgd_t pgd_entry;
	pud_t pud_entry;
	pmd_t pmd_entry;
	pud_t *pud_base;
	pmd_t *pmd_base;
	pte_t *pte_base;

	if (path.pgd_index == GB_VME_UNSPEC_INDEX) {
		_gb_vme_fill_pgd(vme, pgd_base);
		return 0;
	}

	/* Check PGD entry is present */
	pgd_entry = READ_ONCE(pgd_base[path.pgd_index]);
	if (pgd_none(pgd_entry) || pgd_bad(pgd_entry) ||
	    !pgd_present(pgd_entry)) {
		return -EFAULT;
	}

	/* Get PUD */
	pud_base = (pud_t *)pgd_page_vaddr(pgd_entry);
	if (path.pud_index == GB_VME_UNSPEC_INDEX) {
		_gb_vme_fill_pud(vme, pud_base);
		return 0;
	}

	/* Check PUD entry is present */
	pud_entry = READ_ONCE(pud_base[path.pud_index]);
	if (pud_none(pud_entry) || pud_bad(pud_entry) ||
	    !pud_present(pud_entry)) {
		return -EFAULT;
	}

	/* Get PMD */
	pmd_base = (pmd_t *)pud_page_vaddr(pud_entry);
	if (path.pmd_index == GB_VME_UNSPEC_INDEX) {
		_gb_vme_fill_pmd(vme, pmd_base);
		return 0;
	}

	/* Check PMD entry is present */
	pmd_entry = READ_ONCE(pmd_base[path.pmd_index]);
	if (pmd_none(pmd_entry) || pmd_bad(pmd_entry) ||
	    !pmd_present(pmd_entry)) {
		return -EFAULT;
	}

	/* Get PTE */
	pte_base = (pte_t *)pmd_page_vaddr(pmd_entry);
	if (path.pte_index == GB_VME_UNSPEC_INDEX) {
		_gb_vme_fill_pte(vme, pte_base);
		return 0;
	}

	/* This function can not get page contents */
	return -ENOTSUPP;
}

VISIBLE_IF_KUNIT int gb_vme_fill(struct gb_vme *vme, struct mm_struct *mm,
				 struct gb_vme_path path)
{
	int res;

	mmap_read_lock(mm);
	res = _gb_vme_fill(vme, READ_ONCE(mm->pgd), path);
	mmap_read_unlock(mm);

	return res;
}

VISIBLE_IF_KUNIT bool gb_vme_validate_path(struct gb_vme_path path)
{
	/* PGD -> PUD -> PMD -> PTE */
	if (path.pgd_index == GB_VME_UNSPEC_INDEX) {
		return path.pud_index == GB_VME_UNSPEC_INDEX &&
		       path.pmd_index == GB_VME_UNSPEC_INDEX &&
		       path.pte_index == GB_VME_UNSPEC_INDEX;
	}

	if (path.pgd_index < 0 || path.pgd_index >= PTRS_PER_PGD) {
		return false;
	}

	if (path.pud_index == GB_VME_UNSPEC_INDEX) {
		return path.pmd_index == GB_VME_UNSPEC_INDEX &&
		       path.pte_index == GB_VME_UNSPEC_INDEX;
	}

	if (path.pud_index < 0 || path.pud_index >= PTRS_PER_PUD) {
		return false;
	}

	if (path.pmd_index == GB_VME_UNSPEC_INDEX) {
		return path.pte_index == GB_VME_UNSPEC_INDEX;
	}

	if (path.pmd_index < 0 || path.pmd_index >= PTRS_PER_PMD) {
		return false;
	}

	if (path.pte_index == GB_VME_UNSPEC_INDEX) {
		return true;
	}

	if (path.pte_index < 0 || path.pte_index >= PTRS_PER_PTE) {
		return false;
	}

	return true;
}

struct gb_vme *gb_vme_get(struct gb_task_key key, struct gb_vme_path path)
{
	struct task_struct *task;
	struct mm_struct *mm;
	struct gb_vme *vme;
	int res;

	if (!gb_vme_validate_path(path)) {
		return ERR_PTR(-EINVAL);
	}

	vme = kzalloc(sizeof(*vme), GFP_KERNEL);
	if (!vme) {
		res = -ENOMEM;
		goto vme_fail;
	}

	task = gb_find_get_task(key);
	if (!task) {
		res = -ESRCH;
		goto task_fail;
	}

	mm = get_task_mm(task);
	if (!mm) {
		res = -ENXIO;
		goto mm_fail;
	}

	res = gb_vme_fill(vme, mm, path);
	if (res)
		goto fill_fail;

	mmput(mm);
	put_task_struct(task);

	return vme;

fill_fail:
	mmput(mm);
mm_fail:
	put_task_struct(task);
task_fail:
	kfree(vme);
vme_fail:
	return ERR_PTR(res);
}

#ifdef CONFIG_KUNIT
#include "vmexplorer_test.c"
#endif
