#ifndef GB_NETLINK_H
#define GB_NETLINK_H

#define GB_FAMILY_NAME "GLASSBOX"

/* Attributes */
enum {
	GB_ATTR_UNSPEC,

	/* Proctree */
	GB_ATTR_PROCTREE_NODE,

	/* Taskview */
	GB_ATTR_TASKVIEW_PID,
	GB_ATTR_TASKVIEW_START_TIME,
	GB_ATTR_TASKVIEW_DATA,

	__GB_ATTR_MAX,
};
#define GB_ATTR_MAX (__GB_ATTR_MAX - 1)

/* Commands */
enum {
	GB_CMD_UNSPEC,

	/* Proctree */
	GB_CMD_PROCTREE_DUMP,

	/* Taskview */
	GB_CMD_TASKVIEW_REQ,

	__GB_CMD_MAX,
};
#define GB_CMD_MAX (__GB_CMD_MAX - 1)

extern struct genl_family gb_genl_family;

int gb_netlink_init(void);
void gb_netlink_exit(void);

#endif /* GB_NETLINK_H */
