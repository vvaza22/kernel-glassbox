#include "gb_helper.h"
#include "gb_vmexplorer.h"
#include "linux/kconfig.h"
#include <asm/pgtable_64_types.h>
#include <asm/pgtable_types.h>
#include <linux/pfn.h>
#include <linux/pgtable.h>
#include <asm/pgtable.h>
#include <linux/sched.h>
#include <linux/sched/mm.h>
#include <linux/sched/task.h>
#include <linux/slab.h>

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
#ifndef CONFIG_SPLIT_PTE_PTLOCKS
#error "Split PTE PTLocks must be enabled"
#endif
#ifndef CONFIG_TRANSPARENT_HUGEPAGE
#error "THP must be enabled for go tests to work"
#endif

	// if (IS_ENABLED(CONFIG_PGTABLE_HAS_HUGE_LEAVES)) {
	// 	pr_err("%s: Huge page support is not supported\n", __func__);
	// 	return -ENOTSUPP;
	// }

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

static u64 _gb_vme_path_to_user_va(struct gb_vme_path path)
{
	u64 va = 0;

	if (path.l4 != GB_VME_UNSPEC_INDEX)
		va |= (u64)path.l4 << PGDIR_SHIFT;

	if (path.l3 != GB_VME_UNSPEC_INDEX)
		va |= (u64)path.l3 << PUD_SHIFT;

	if (path.l2 != GB_VME_UNSPEC_INDEX)
		va |= (u64)path.l2 << PMD_SHIFT;

	if (path.l1 != GB_VME_UNSPEC_INDEX)
		va |= (u64)path.l1 << PAGE_SHIFT;

	/* 
	Virtual address should be in canonical form, which means bits 63:48 should repeat bit 47.
	Turns out this is a CPU level restriction for x86-64 architecture.
	Source: https://dev.to/junyaa/x64-virtual-address-translation-3bmb 
	*/
	if (va & (1UL << 47))
		va |= (u64)0xffff000000000000UL;

	return va;
}

static u64 _gb_vme_l4_pa(p4d_t entry)
{
	/* https://elixir.bootlin.com/linux/v6.12.74/source/include/linux/pfn.h#L21 */
	return PFN_PHYS(p4d_pfn(entry));
}

static u64 _gb_vme_l4_kernel_va(p4d_t entry)
{
	return (u64)__va(_gb_vme_l4_pa(entry));
}

static u64 _gb_vme_l3_pa(pud_t entry)
{
	return PFN_PHYS(pud_pfn(entry));
}

static u64 _gb_vme_l3_kernel_va(pud_t entry)
{
	return (u64)__va(_gb_vme_l3_pa(entry));
}

static u64 _gb_vme_l2_pa(pmd_t entry)
{
	return PFN_PHYS(pmd_pfn(entry));
}

static u64 _gb_vme_l2_kernel_va(pmd_t entry)
{
	return (u64)__va(_gb_vme_l2_pa(entry));
}

static u64 _gb_vme_l1_pa(pte_t entry)
{
	return PFN_PHYS(pte_pfn(entry));
}

static u64 _gb_vme_l1_kernel_va(pte_t entry)
{
	return (u64)__va(_gb_vme_l1_pa(entry));
}

static void _gb_vme_fill_l4(struct gb_vme *vme, p4d_t *base)
{
	for (int i = 0; i < GB_VME_NUM_ENTRIES; i++) {
		p4d_t entry = p4dp_get(base + i);
		struct gb_vme_entry *vme_entry_ptr = &vme->entries[i];

		if (p4d_none(entry)) {
			vme_entry_ptr->none = true;
			continue;
		}

		vme_entry_ptr->value = p4d_val(entry);
		vme_entry_ptr->pa = _gb_vme_l4_pa(entry);
		vme_entry_ptr->kernel_va = _gb_vme_l4_kernel_va(entry);
		vme_entry_ptr->user_va =
			_gb_vme_path_to_user_va((struct gb_vme_path){
				.l4 = i,
				.l3 = GB_VME_UNSPEC_INDEX,
				.l2 = GB_VME_UNSPEC_INDEX,
				.l1 = GB_VME_UNSPEC_INDEX,
			});
		vme_entry_ptr->size = P4D_SIZE;
		vme_entry_ptr->present = p4d_present(entry);
		vme_entry_ptr->bad = p4d_bad(entry);
		vme_entry_ptr->leaf = p4d_leaf(entry);
		vme_entry_ptr->none = false;
	}
}

static void _gb_vme_fill_l3(struct gb_vme *vme, pud_t *base,
			    struct gb_vme_path path)
{
	for (int i = 0; i < GB_VME_NUM_ENTRIES; i++) {
		pud_t entry = pudp_get(base + i);
		struct gb_vme_entry *vme_entry_ptr = &vme->entries[i];

		if (pud_none(entry)) {
			vme_entry_ptr->none = true;
			continue;
		}

		vme_entry_ptr->value = pud_val(entry);
		vme_entry_ptr->pa = _gb_vme_l3_pa(entry);
		vme_entry_ptr->kernel_va = _gb_vme_l3_kernel_va(entry);
		vme_entry_ptr->user_va =
			_gb_vme_path_to_user_va((struct gb_vme_path){
				.l4 = path.l4,
				.l3 = i,
				.l2 = GB_VME_UNSPEC_INDEX,
				.l1 = GB_VME_UNSPEC_INDEX,
			});
		vme_entry_ptr->size = PUD_SIZE;
		vme_entry_ptr->present = pud_present(entry);
		vme_entry_ptr->bad = pud_bad(entry);
		vme_entry_ptr->leaf = pud_leaf(entry);
		vme_entry_ptr->none = false;
	}
}

static void _gb_vme_fill_l2(struct gb_vme *vme, pmd_t *base,
			    struct gb_vme_path path)
{
	for (int i = 0; i < GB_VME_NUM_ENTRIES; i++) {
		pmd_t entry = pmdp_get(base + i);
		struct gb_vme_entry *vme_entry_ptr = &vme->entries[i];

		if (pmd_none(entry)) {
			vme_entry_ptr->none = true;
			continue;
		}

		vme_entry_ptr->value = pmd_val(entry);
		vme_entry_ptr->pa = _gb_vme_l2_pa(entry);
		vme_entry_ptr->kernel_va = _gb_vme_l2_kernel_va(entry);
		vme_entry_ptr->user_va =
			_gb_vme_path_to_user_va((struct gb_vme_path){
				.l4 = path.l4,
				.l3 = path.l3,
				.l2 = i,
				.l1 = GB_VME_UNSPEC_INDEX,
			});
		vme_entry_ptr->size = PMD_SIZE;
		vme_entry_ptr->present = pmd_present(entry);
		vme_entry_ptr->bad = pmd_bad(entry);
		vme_entry_ptr->leaf = pmd_leaf(entry);
		vme_entry_ptr->none = false;
	}
}

static void _gb_vme_fill_l1(struct gb_vme *vme, pte_t *base,
			    struct gb_vme_path path)
{
	for (int i = 0; i < GB_VME_NUM_ENTRIES; i++) {
		pte_t pte_entry = ptep_get(base + i);
		struct gb_vme_entry *vme_entry_ptr = &vme->entries[i];

		if (pte_none(pte_entry)) {
			vme_entry_ptr->none = true;
			continue;
		}

		vme_entry_ptr->value = pte_val(pte_entry);
		vme_entry_ptr->pa = _gb_vme_l1_pa(pte_entry);
		vme_entry_ptr->kernel_va = _gb_vme_l1_kernel_va(pte_entry);
		vme_entry_ptr->user_va =
			_gb_vme_path_to_user_va((struct gb_vme_path){
				.l4 = path.l4,
				.l3 = path.l3,
				.l2 = path.l2,
				.l1 = i,
			});
		vme_entry_ptr->size = PAGE_SIZE;
		vme_entry_ptr->present = pte_present(pte_entry);
		/* PTE entries are never bad and are always leaves */
		vme_entry_ptr->bad = false;
		vme_entry_ptr->leaf = true;
		vme_entry_ptr->none = false;
	}
}

static pud_t *_gb_vme_l4_to_l3(p4d_t *base, int index)
{
	/*
	This is the most elegant way to read the entries that I could find.
	It uses READ_ONCE internally.
	https://elixir.bootlin.com/linux/v6.12.74/source/include/linux/pgtable.h#L338
	*/
	const p4d_t entry = p4dp_get(base + index);

	if (p4d_none(entry) || p4d_leaf(entry) || !p4d_present(entry)) {
		return NULL;
	}

	return p4d_pgtable(entry);
}

static pmd_t *_gb_vme_l3_to_l2(pud_t *base, int index)
{
	const pud_t entry = pudp_get(base + index);

	if (pud_none(entry) || pud_leaf(entry) || !pud_present(entry)) {
		return NULL;
	}

	return pud_pgtable(entry);
}

static pte_t *_gb_vme_l2_to_l1(pmd_t *base, int index)
{
	pmd_t entry = pmdp_get(base + index);

	if (pmd_none(entry)) {
		pr_err("%s: PMD[%d] is none\n", __func__, index);
		return NULL;
	}

	if (!pmd_present(entry)) {
		pr_err("%s: PMD[%d] is not present\n", __func__, index);
		return NULL;
	}

	if (pmd_leaf(entry)) {
		pr_err("%s: PMD[%d] is a leaf\n", __func__, index);
		return NULL;
	}

	/* 
	pmd_pgtable works differently and returns struct page pointer.
	Source: https://elixir.bootlin.com/linux/v6.12.74/source/include/linux/pgtable.h#L50	
	Therefore, had to use my implementation.
	*/
	return (pte_t *)_gb_vme_l2_kernel_va(entry);
}

static int __gb_vme_fill(struct gb_vme *vme, pgd_t *pgd,
			 struct gb_vme_path path)
{
	/*
	TODO: Has potential locking issues. Research: pte_lockptr, pmd_lockptr, pud_lockptr.
	https://elixir.bootlin.com/linux/v6.12.74/source/include/linux/mm.h#L3183
	https://lwn.net/Articles/568076/
	Also research folio_walk_start() for locking mechanisms.
	https://elixir.bootlin.com/linux/v6.12.74/source/mm/pagewalk.c#L715
	TODO: Add swapped out entry support.
	*/

	/*
	Linux has logical 5-level page table tree, that folds to 4-level tree on most CPUs.
	My module currently only supports 4-level page tables.
	In 4-level tree PGD = P4D, but PGD related functions like pgd_none, pgd_bad, pgd_present,
	are hardcoded to always return the same boolean, no matter the input.
	Source: https://elixir.bootlin.com/linux/v6.12.74/source/arch/x86/include/asm/pgtable.h#L1209
	Therefore, I have to manually fold PGD into P4D and then use P4D functions.
	*/
	p4d_t *l4_base = (p4d_t *)pgd;
	pud_t *l3_base;
	pmd_t *l2_base;
	pte_t *l1_base;

	if (path.l4 == GB_VME_UNSPEC_INDEX) {
		_gb_vme_fill_l4(vme, l4_base);
		return 0;
	}

	l3_base = _gb_vme_l4_to_l3(l4_base, path.l4);
	if (!l3_base) {
		return -EFAULT;
	}

	if (path.l3 == GB_VME_UNSPEC_INDEX) {
		_gb_vme_fill_l3(vme, l3_base, path);
		return 0;
	}

	l2_base = _gb_vme_l3_to_l2(l3_base, path.l3);
	if (!l2_base) {
		return -EFAULT;
	}

	if (path.l2 == GB_VME_UNSPEC_INDEX) {
		_gb_vme_fill_l2(vme, l2_base, path);
		return 0;
	}

	l1_base = _gb_vme_l2_to_l1(l2_base, path.l2);
	if (!l1_base) {
		return -EFAULT;
	}

	if (path.l1 == GB_VME_UNSPEC_INDEX) {
		_gb_vme_fill_l1(vme, l1_base, path);
		return 0;
	}

	/* This function can not get page contents */
	return -ENOTSUPP;
}

static int _gb_vme_fill(struct gb_vme *vme, struct mm_struct *mm,
			struct gb_vme_path path)
{
	int res;

	mmap_read_lock(mm);
	res = __gb_vme_fill(vme, READ_ONCE(mm->pgd), path);
	mmap_read_unlock(mm);

	return res;
}

static bool _gb_vme_validate_path(struct gb_vme_path path)
{
	/* PGD -> PUD -> PMD -> PTE */
	if (path.l4 == GB_VME_UNSPEC_INDEX) {
		return path.l3 == GB_VME_UNSPEC_INDEX &&
		       path.l2 == GB_VME_UNSPEC_INDEX &&
		       path.l1 == GB_VME_UNSPEC_INDEX;
	}

	if (path.l4 < 0 || path.l4 >= GB_VME_NUM_ENTRIES) {
		return false;
	}

	if (path.l3 == GB_VME_UNSPEC_INDEX) {
		return path.l2 == GB_VME_UNSPEC_INDEX &&
		       path.l1 == GB_VME_UNSPEC_INDEX;
	}

	if (path.l3 < 0 || path.l3 >= GB_VME_NUM_ENTRIES) {
		return false;
	}

	if (path.l2 == GB_VME_UNSPEC_INDEX) {
		return path.l1 == GB_VME_UNSPEC_INDEX;
	}

	if (path.l2 < 0 || path.l2 >= GB_VME_NUM_ENTRIES) {
		return false;
	}

	if (path.l1 == GB_VME_UNSPEC_INDEX) {
		return true;
	}

	if (path.l1 < 0 || path.l1 >= GB_VME_NUM_ENTRIES) {
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

	if (!_gb_vme_validate_path(path)) {
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

	res = _gb_vme_fill(vme, mm, path);
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
