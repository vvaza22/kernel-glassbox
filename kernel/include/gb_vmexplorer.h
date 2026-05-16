#ifndef GB_VMEXPLORER_H
#define GB_VMEXPLORER_H

#include <asm/pgtable.h>
#include <linux/bug.h>
#include <linux/types.h>

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
	u64 address;
};

struct gb_vme {
	struct gb_vme_entry entries[GB_VME_NUM_ENTRIES];
};

/* Sanity checks */
int gb_vme_sanity_check(void);

#endif /* GB_VMEXPLORER_H */
