#ifndef GB_VMEXPLORER_H
#define GB_VMEXPLORER_H

#include "gb_model.h"
#include <asm/pgtable.h>
#include <linux/bug.h>
#include <linux/types.h>
#include <kunit/visibility.h>

/* Assume that every level contains 512 entries */
#define GB_VME_NUM_ENTRIES 512

/* 
	Docs about page tables: https://docs.kernel.org/mm/page_tables.html
	This module only supports 4-level page tables.

	Level 1 = Page Table Entry(PTE) - Each entry points to a 4KB page.
	Level 2 = Page Middle Directory(PMD) - Each entry points to L1 or a 2MB page.
	Level 3 = Page Upper Directory(PUD) - Each entry points to L2 or a 1GB page.
	Level 4 = Page Level 4 Directory(P4D) = Page Global Directory(PGD) - 
	Each entry points to L3.

	Every level has 512 entries.
*/

struct gb_vme_entry {
	u64 value;
	u64 pa;
	u64 kernel_va;
	u64 user_va;
	bool present;
	bool bad;
	bool leaf;
};

struct gb_vme {
	struct gb_vme_entry entries[GB_VME_NUM_ENTRIES];
};

#define GB_VME_UNSPEC_INDEX -1

/*
	Remainder to myself: ALWAYS prefix field names.
	pgd_index turns out to be a MACRO in linux/pgtable.h, 
	naming struct field pgd_index messes up the whole code.
*/
struct gb_vme_path {
	int l4;
	int l3;
	int l2;
	int l1;
};

int gb_vme_sanity_check(void);
struct gb_vme *gb_vme_get(struct gb_task_key key, struct gb_vme_path path);
void gb_vme_free(struct gb_vme *vme);

#endif /* GB_VMEXPLORER_H */
