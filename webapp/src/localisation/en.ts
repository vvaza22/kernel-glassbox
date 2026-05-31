export const en = {
  proctree: {
    loading: "Loading process tree...",
  },
  vmexplorer: {
    backToProctree: "Process Tree",
    title: "Virtual Memory Explorer",
    pidBadge: "pid:",
    startTimeBadge: "start_time:",
    commBadge: "comm:",
    noEntries: "No entries",
    entries: "entries",
    lvlRoot: "PGD ROOT",
    lvl4: "PGD",
    lvl3: "PUD",
    lvl2: "PMD",
    lvl1: "PTE",
    pageUpper: "PAGE",
    pageTableUpper: "PGTBL",
    entryRaw: "Raw(HEX)",
    entryPA: "PA",
    entryKernelVA: "KERNEL VA",
    entryUserVA: "USER VA",
    regionLabel: "Region",
    flagsLabel: "Flags",
    startLabel: "Start:",
    endLabel: "End:",
    sizeLabel: "Size:",
    flags: {
      present: {
        label: "PRESENT",
        desc: "Is mapped",
      },
      rw: {
        label: "RW",
        desc: "Read/Write",
      },
      user: {
        label: "USER",
        desc: "User accessible",
      },
      pwt: {
        label: "PWT",
        desc: "Page Write Through",
      },
      pcd: {
        label: "PCD",
        desc: "Page Cache Disable",
      },
      accessed: {
        label: "ACCESSED",
        desc: "Was accessed",
      },
      dirty: {
        label: "DIRTY",
        desc: "Was written",
      },
      pse: {
        label: "PSE",
        desc: "Page Size Extension",
      },
      global: {
        label: "GLOBAL",
        desc: "Global page",
      },
      nx: {
        label: "NX",
        desc: "No execute",
      },
    },
  },
};
