# Tell make that these targets are not files
.PHONY: all clean

ifneq ($(KERNELRELEASE),)
# -> KBUILD Context

obj-m := glassbox.o
glassbox-y := \
	src/main.o \
	src/netlink.o \
	src/helper.o \
	src/proctree.o \
	src/taskview.o \
	src/vmexplorer.o \
	src/nl_proctree.o \
	src/nl_taskview.o
ccflags-y := -I$(src)/../include

else
# -> User Context

# Let the user override KDIR if they want to
KDIR ?= /lib/modules/$(shell uname -r)/build
# TODO: using pwd is a bad idea.
ROOT_DIR := $(shell pwd)
BUILD_DIR := $(ROOT_DIR)/build

all: $(BUILD_DIR)
	@rsync -a --exclude='build' $(ROOT_DIR)/ $(BUILD_DIR)/
	$(MAKE) -C $(KDIR) M=$(BUILD_DIR) modules

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

clean:
	rm -rf $(BUILD_DIR)

endif
