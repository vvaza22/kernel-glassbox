#ifndef GB_NETLINK_H
#define GB_NETLINK_H

#define GB_GENL_FAMILY_NAME "GLASSBOX"

/* Attributes */
enum {
	GB_NL_ATTR_UNSPEC,

	/* Proctree */
	GB_NL_ATTR_PROCTREE_NODE,

	/* Taskview */
	GB_NL_ATTR_TASKVIEW_PID,
	GB_NL_ATTR_TASKVIEW_START_TIME,
	GB_NL_ATTR_TASKVIEW_DATA,

	/* VM Explorer */
	GB_NL_ATTR_VME_PGD_INDEX,
	GB_NL_ATTR_VME_PUD_INDEX,
	GB_NL_ATTR_VME_PMD_INDEX,
	GB_NL_ATTR_VME_PTE_INDEX,
	GB_NL_ATTR_VME_PID,
	GB_NL_ATTR_VME_START_TIME,
	GB_NL_ATTR_VME_ENTRY,

	/* Schedhook */
	GB_NL_ATTR_SCHEDHOOK_EVENT,

	__GB_NL_ATTR_MAX,
};
#define GB_NL_ATTR_MAX (__GB_NL_ATTR_MAX - 1)

/* Commands */
enum {
	GB_NL_CMD_UNSPEC,

	/* Proctree */
	GB_NL_CMD_PROCTREE_DUMP,

	/* Taskview */
	GB_NL_CMD_TASKVIEW_GET,

	/* VM Explorer */
	GB_NL_CMD_VME_DUMP,

	/* Schedhook */
	GB_NL_CMD_SCHEDHOOK_CAP_START,
	GB_NL_CMD_SCHEDHOOK_CAP_END,

	__GB_NL_CMD_MAX,
};
#define GB_NL_CMD_MAX (__GB_NL_CMD_MAX - 1)

extern struct genl_family gb_genl_family;

int gb_netlink_init(void);
void gb_netlink_exit(void);

#endif /* GB_NETLINK_H */
