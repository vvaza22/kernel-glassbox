#include "gb_vmexplorer.h"
#include <asm/pgtable.h>

int gb_vme_sanity_check(void)
{
	/* Make sure the current architecture has 512 entries at each level */
	BUILD_BUG_ON(GB_VME_NUM_ENTRIES != PTRS_PER_PTE);
	BUILD_BUG_ON(GB_VME_NUM_ENTRIES != PTRS_PER_PMD);
	BUILD_BUG_ON(GB_VME_NUM_ENTRIES != PTRS_PER_PUD);
	BUILD_BUG_ON(GB_VME_NUM_ENTRIES != PTRS_PER_PGD);

	/* Make sure the kernel only uses 4 level page tables */
	if (pgtable_l5_enabled()) {
		pr_err("%s: 5-level page tables are not supported\n", __func__);
		return -ENOTSUPP;
	} else {
		pr_info("%s: Using 4-level page tables\n", __func__);
	}

	return 0;
}
