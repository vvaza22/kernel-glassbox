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

static inline unsigned long pte_page_vaddr(pte_t pte)
{
	return (unsigned long)__va(pte_pfn(pte) << PAGE_SHIFT);
}

int gb_vme_sanity_check(void)
{
#ifdef CONFIG_X86_PAE
/* https://elixir.bootlin.com/linux/v6.12.74/source/arch/x86/mm/pgtable.c#L367 */
#error "Physical Address Extension (PAE) is not supported"
#endif
#ifndef CONFIG_SPLIT_PTE_PTLOCKS
#error "Split PTE PTLocks must be enabled"
#endif
#ifndef CONFIG_TRANSPARENT_HUGEPAGE
#error "Transparent hugepages are supported"
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
	}

	return 0;
}

static u64 gb_vme_path_to_user_va(struct gb_vme_path path)
{
	u64 va = 0;

	if (path.gb_vme_pgd_index != GB_VME_UNSPEC_INDEX)
		va |= (u64)path.gb_vme_pgd_index << PGDIR_SHIFT;

	if (path.gb_vme_pud_index != GB_VME_UNSPEC_INDEX)
		va |= (u64)path.gb_vme_pud_index << PUD_SHIFT;

	if (path.gb_vme_pmd_index != GB_VME_UNSPEC_INDEX)
		va |= (u64)path.gb_vme_pmd_index << PMD_SHIFT;

	if (path.gb_vme_pte_index != GB_VME_UNSPEC_INDEX)
		va |= (u64)path.gb_vme_pte_index << PAGE_SHIFT;

	/* 
	Virtual address should be in canonical form, which means bits 63:48 should repeat bit 47.
	Turns out this is a CPU level restriction for x86-64 architecture.
	Source: https://dev.to/junyaa/x64-virtual-address-translation-3bmb 
	*/
	if (va & (1UL << 47))
		va |= (u64)0xffff000000000000UL;

	return va;
}

static void _gb_vme_fill_pgd(struct gb_vme *vme, pgd_t *pgd,
			     struct gb_vme_path path)
{
	for (int i = 0; i < PTRS_PER_PGD; i++) {
		pgd_t pgd_entry = READ_ONCE(pgd[i]);
		struct gb_vme_entry *vme_entry_ptr = &vme->entries[i];

		if (pgd_none(pgd_entry)) {
			continue;
		}

		vme_entry_ptr->value = pgd_val(pgd_entry);
		vme_entry_ptr->kernel_va = (u64)pgd_page_vaddr(pgd_entry);
		vme_entry_ptr->user_va =
			gb_vme_path_to_user_va((struct gb_vme_path){
				.gb_vme_pgd_index = i,
				.gb_vme_pud_index = path.gb_vme_pud_index,
				.gb_vme_pmd_index = path.gb_vme_pmd_index,
				.gb_vme_pte_index = path.gb_vme_pte_index,
			});
		vme_entry_ptr->pa = (u64)__pa(vme_entry_ptr->kernel_va);
		vme_entry_ptr->present = pgd_present(pgd_entry);
		vme_entry_ptr->bad = pgd_bad(pgd_entry);
		vme_entry_ptr->leaf = pgd_leaf(pgd_entry);
	}
}

static void _gb_vme_fill_pud(struct gb_vme *vme, pud_t *pud,
			     struct gb_vme_path path)
{
	for (int i = 0; i < PTRS_PER_PUD; i++) {
		pud_t pud_entry = READ_ONCE(pud[i]);
		struct gb_vme_entry *vme_entry_ptr = &vme->entries[i];

		if (pud_none(pud_entry)) {
			continue;
		}

		vme_entry_ptr->value = pud_val(pud_entry);
		vme_entry_ptr->kernel_va = (u64)pud_page_vaddr(pud_entry);
		vme_entry_ptr->user_va =
			gb_vme_path_to_user_va((struct gb_vme_path){
				.gb_vme_pgd_index = path.gb_vme_pgd_index,
				.gb_vme_pud_index = i,
				.gb_vme_pmd_index = path.gb_vme_pmd_index,
				.gb_vme_pte_index = path.gb_vme_pte_index,
			});
		vme_entry_ptr->pa = (u64)__pa((void *)vme_entry_ptr->kernel_va);
		vme_entry_ptr->present = pud_present(pud_entry);
		vme_entry_ptr->bad = pud_bad(pud_entry);
		vme_entry_ptr->leaf = pud_leaf(pud_entry);
	}
}

static void _gb_vme_fill_pmd(struct gb_vme *vme, pmd_t *pmd,
			     struct gb_vme_path path)
{
	for (int i = 0; i < PTRS_PER_PMD; i++) {
		pmd_t pmd_entry = READ_ONCE(pmd[i]);
		struct gb_vme_entry *vme_entry_ptr = &vme->entries[i];

		if (pmd_none(pmd_entry)) {
			continue;
		}

		vme_entry_ptr->value = pmd_val(pmd_entry);
		vme_entry_ptr->kernel_va = (u64)pmd_page_vaddr(pmd_entry);
		vme_entry_ptr->user_va =
			gb_vme_path_to_user_va((struct gb_vme_path){
				.gb_vme_pgd_index = path.gb_vme_pgd_index,
				.gb_vme_pud_index = path.gb_vme_pud_index,
				.gb_vme_pmd_index = i,
				.gb_vme_pte_index = path.gb_vme_pte_index,
			});
		vme_entry_ptr->pa = (u64)__pa((void *)vme_entry_ptr->kernel_va);
		vme_entry_ptr->present = pmd_present(pmd_entry);
		vme_entry_ptr->bad = pmd_bad(pmd_entry);
		vme_entry_ptr->leaf = pmd_leaf(pmd_entry);
	}
}

static void _gb_vme_fill_pte(struct gb_vme *vme, pte_t *pte,
			     struct gb_vme_path path)
{
	for (int i = 0; i < PTRS_PER_PTE; i++) {
		pte_t pte_entry = READ_ONCE(pte[i]);
		struct gb_vme_entry *vme_entry_ptr = &vme->entries[i];

		if (pte_none(pte_entry)) {
			continue;
		}

		vme_entry_ptr->value = pte_val(pte_entry);
		vme_entry_ptr->kernel_va = (u64)pte_page_vaddr(pte_entry);
		vme_entry_ptr->user_va =
			gb_vme_path_to_user_va((struct gb_vme_path){
				.gb_vme_pgd_index = path.gb_vme_pgd_index,
				.gb_vme_pud_index = path.gb_vme_pud_index,
				.gb_vme_pmd_index = path.gb_vme_pmd_index,
				.gb_vme_pte_index = i,
			});
		vme_entry_ptr->pa = (u64)__pa((void *)vme_entry_ptr->kernel_va);
		vme_entry_ptr->present = pte_present(pte_entry);
		/* PTE entries are never bad and are always leaves */
		vme_entry_ptr->bad = false;
		vme_entry_ptr->leaf = true;
	}
}

static int _gb_vme_fill(struct gb_vme *vme, pgd_t *pgd_base,
			struct gb_vme_path path)
{
	/*
	TODO: Function is too big.
	TODO: Has potential locking issues. Research: pte_lockptr, pmd_lockptr, pud_lockptr.
	https://elixir.bootlin.com/linux/v6.12.74/source/include/linux/mm.h#L3183
	https://lwn.net/Articles/568076/
	TODO: Add swapped out entry support.
	*/
	pgd_t pgd_entry;
	pud_t pud_entry;
	pmd_t pmd_entry;
	pud_t *pud_base;
	pmd_t *pmd_base;
	pte_t *pte_base;

	if (path.gb_vme_pgd_index == GB_VME_UNSPEC_INDEX) {
		_gb_vme_fill_pgd(vme, pgd_base, path);
		return 0;
	}

	/* Check PGD entry is present */
	pgd_entry = READ_ONCE(pgd_base[path.gb_vme_pgd_index]);
	if (pgd_none(pgd_entry) || pgd_bad(pgd_entry) ||
	    !pgd_present(pgd_entry)) {
		return -EFAULT;
	}

	/* Get PUD */
	pud_base = (pud_t *)pgd_page_vaddr(pgd_entry);
	if (path.gb_vme_pud_index == GB_VME_UNSPEC_INDEX) {
		_gb_vme_fill_pud(vme, pud_base, path);
		return 0;
	}

	/* Check PUD entry is present */
	pud_entry = READ_ONCE(pud_base[path.gb_vme_pud_index]);
	if (pud_none(pud_entry) || pud_bad(pud_entry) || pud_leaf(pud_entry) ||
	    !pud_present(pud_entry)) {
		return -EFAULT;
	}

	/* Get PMD */
	pmd_base = (pmd_t *)pud_page_vaddr(pud_entry);
	if (path.gb_vme_pmd_index == GB_VME_UNSPEC_INDEX) {
		_gb_vme_fill_pmd(vme, pmd_base, path);
		return 0;
	}

	/* Check PMD entry is present */
	pmd_entry = READ_ONCE(pmd_base[path.gb_vme_pmd_index]);
	if (pmd_none(pmd_entry) || pmd_bad(pmd_entry) || pmd_leaf(pmd_entry) ||
	    !pmd_present(pmd_entry)) {
		return -EFAULT;
	}

	/* Get PTE */
	pte_base = (pte_t *)pmd_page_vaddr(pmd_entry);
	if (path.gb_vme_pte_index == GB_VME_UNSPEC_INDEX) {
		_gb_vme_fill_pte(vme, pte_base, path);
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
	if (path.gb_vme_pgd_index == GB_VME_UNSPEC_INDEX) {
		return path.gb_vme_pud_index == GB_VME_UNSPEC_INDEX &&
		       path.gb_vme_pmd_index == GB_VME_UNSPEC_INDEX &&
		       path.gb_vme_pte_index == GB_VME_UNSPEC_INDEX;
	}

	if (path.gb_vme_pgd_index < 0 ||
	    path.gb_vme_pgd_index >= PTRS_PER_PGD) {
		return false;
	}

	if (path.gb_vme_pud_index == GB_VME_UNSPEC_INDEX) {
		return path.gb_vme_pmd_index == GB_VME_UNSPEC_INDEX &&
		       path.gb_vme_pte_index == GB_VME_UNSPEC_INDEX;
	}

	if (path.gb_vme_pud_index < 0 ||
	    path.gb_vme_pud_index >= PTRS_PER_PUD) {
		return false;
	}

	if (path.gb_vme_pmd_index == GB_VME_UNSPEC_INDEX) {
		return path.gb_vme_pte_index == GB_VME_UNSPEC_INDEX;
	}

	if (path.gb_vme_pmd_index < 0 ||
	    path.gb_vme_pmd_index >= PTRS_PER_PMD) {
		return false;
	}

	if (path.gb_vme_pte_index == GB_VME_UNSPEC_INDEX) {
		return true;
	}

	if (path.gb_vme_pte_index < 0 ||
	    path.gb_vme_pte_index >= PTRS_PER_PTE) {
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

	/* TODO: I should consider switching to vzalloc */
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

void gb_vme_free(struct gb_vme *vme)
{
	if (!vme)
		return;
	kfree(vme);
}

#ifdef CONFIG_KUNIT
#include "vmexplorer_test.c"
#endif
