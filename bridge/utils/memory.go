package utils

import (
	"syscall"
	"unsafe"

	"github.com/pkg/errors"
)

const (
	PageSize     = 4096
	HugePageSize = 2 * 1024 * 1024
)

const (
	// syscall.MADV_COLLAPSE does not exist, so I took the value from kernel source code:
	// https://elixir.bootlin.com/linux/v6.12.74/source/include/uapi/asm-generic/mman-common.h#L80
	MADV_COLLAPSE = 25
)

const (
	// https://elixir.bootlin.com/linux/v6.12.74/source/arch/x86/include/asm/pgtable_64_types.h#L78
	PGD_SHIFT = 39
	// https://elixir.bootlin.com/linux/v6.12.74/source/arch/x86/include/asm/pgtable_64_types.h#L87
	PUD_SHIFT = 30
	// https://elixir.bootlin.com/linux/v6.12.74/source/arch/x86/include/asm/pgtable_64_types.h#L94
	PMD_SHIFT = 21
	// https://elixir.bootlin.com/linux/v6.12.74/source/arch/x86/include/asm/pgtable.h#L1549
	PTE_SHIFT = 12
)

type UnmapFunc func() error

func bufToAddr(buf []byte) uint64 {
	return uint64(uintptr(unsafe.Pointer(&buf[0])))
}

// Precondition: buf is at least 2*sz bytes
func alignBuf(buf []byte, sz uint64) ([]byte, uint64) {
	base := bufToAddr(buf)
	offset := sz - base%sz
	// If base was already aligned, offset=sz
	offset %= sz
	return buf[offset : offset+sz], base + offset
}

func MmapPage() ([]byte, uint64, UnmapFunc, error) {
	buf, err := syscall.Mmap(
		-1,
		0,
		PageSize,
		syscall.PROT_READ|syscall.PROT_WRITE,
		syscall.MAP_ANONYMOUS|syscall.MAP_PRIVATE,
	)
	if err != nil {
		return nil, 0, nil, err
	}
	unmap := func() error {
		return syscall.Munmap(buf)
	}

	// Trigger a page fault
	buf[0] = 1

	return buf, bufToAddr(buf), unmap, nil
}

func MmapHugepageTHP() ([]byte, uint64, UnmapFunc, error) {
	buf, err := syscall.Mmap(
		-1,
		0,
		2*HugePageSize,
		syscall.PROT_READ|syscall.PROT_WRITE,
		syscall.MAP_ANONYMOUS|syscall.MAP_PRIVATE,
	)
	if err != nil {
		return nil, 0, nil, errors.Wrap(err, "failed to mmap")
	}
	// It is important to unmap the entire buffer, not just the aligned one.
	unmap := func() error {
		return syscall.Munmap(buf)
	}

	alignedBuf, alignedAddr := alignBuf(buf, HugePageSize)

	// Enable THP
	err = syscall.Madvise(alignedBuf, syscall.MADV_HUGEPAGE)
	if err != nil {
		unmap()
		return nil, 0, nil, errors.Wrap(err, "failed to enable THP with MADV_HUGEPAGE")
	}

	// Touch every page to ensure they are mapped
	for offset := 0; offset < len(alignedBuf); offset += PageSize {
		alignedBuf[offset] = 1
	}

	// Collapse small pages into a huge page
	err = syscall.Madvise(alignedBuf, MADV_COLLAPSE)
	if err != nil {
		unmap()
		return nil, 0, nil, errors.Wrap(err, "failed to collapse pages with MADV_COLLAPSE")
	}

	return alignedBuf, alignedAddr, unmap, nil
}

// The following functions are implemented according to kernel implementations of
// pgd_index, pud_index, pmd_index, and pte_index:
// https://elixir.bootlin.com/linux/v6.12.74/source/include/linux/pgtable.h#L90
func PGDI(va uint64) int32 {
	return int32((va >> PGD_SHIFT) & 511)
}

func PUDI(va uint64) int32 {
	return int32((va >> PUD_SHIFT) & 511)
}

func PMDI(va uint64) int32 {
	return int32((va >> PMD_SHIFT) & 511)
}

func PTEI(va uint64) int32 {
	return int32((va >> PTE_SHIFT) & 511)
}
