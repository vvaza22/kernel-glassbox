#ifndef GB_VMEXPLORER_H
#define GB_VMEXPLORER_H

#include "gb_model.h"
#include <asm/pgtable.h>
#include <linux/bug.h>
#include <linux/types.h>
#include <kunit/visibility.h>

/* Assume that every level contains 512 entries */
#define GB_VME_NUM_ENTRIES 512

enum gb_vme_level {
	/* 
	Docs about page tables: https://docs.kernel.org/mm/page_tables.html
	This module only supports 4-level page tables and ignores P4D.
	*/

	/* 
	Page Table Entry - Array of PTRS_PER_PTE(512) entries.
	Each entry on this level points to a 4KB page.
	*/
	GB_VME_LEVEL_PTE = 1,

	/*
	Page Middle Directory - Array of PTRS_PER_PMD(512) entries.
	Each entry on this level points to a PTE or a 2MB page.
	*/
	GB_VME_LEVEL_PMD = 2,

	/*
	Page Upper Directory - Array of PTRS_PER_PUD(512) entries.
	Each entry on this level points to a PMD or a 1GB page.
	*/
	GB_VME_LEVEL_PUD = 3,

	/*
	Page Global Directory - Array of PTRS_PER_PGD(512) entries.
	Each entry on this level points to a PUD.
	*/
	GB_VME_LEVEL_PGD = 4,
};

struct gb_vme_entry {
	u64 value;
};

struct gb_vme {
	struct gb_vme_entry entries[GB_VME_NUM_ENTRIES];
	enum gb_vme_level level;
};

#define GB_VME_UNSPEC_INDEX -1

struct gb_vme_path {
	int pgd_index;
	int pud_index;
	int pmd_index;
	int pte_index;
};

int gb_vme_sanity_check(void);
struct gb_vme *gb_vme_get(struct gb_task_key key, struct gb_vme_path path);
VISIBLE_IF_KUNIT int gb_vme_fill(struct gb_vme *vme, struct mm_struct *mm,
				 struct gb_vme_path path);
VISIBLE_IF_KUNIT bool gb_vme_validate_path(struct gb_vme_path path);

#endif /* GB_VMEXPLORER_H */
