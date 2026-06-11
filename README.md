# Kernel Glassbox

> A real-time Linux kernel visualizer/observability tool

## Features

### Process Tree Explorer

![Proctree](assets/proctree.png)

Process Tree Explorer lets you visualize the entire tree of the running processes + their internal threads. User-Space processes are colored BLUE and Kernel-Space processes are colored RED.

### Task View

![Taskview](assets/taskview.png)

Task View lets you introspect _task_struct_, _mm_struct_, _real_creds_, _sched_entity_ kernel level data structures for each process.

### VM Explorer

![VMExplorer](assets/vmexplorer.png)

Virtual Memory Explorer lets you explore the page tables for each process, see detailed information about each page entry like Physical Memory to User-Space Virtual Memory mapping, page size, page flags and so on.

### Scheduler Visualizer

![Schedhook](assets/schedhook.png)

Scheduler Visualizer lets you capture _sched_switch_ events and visualize per CPU core activity with nanosecond precision.
