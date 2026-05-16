.PHONY: kbuild kload kunload gotest gorun webtest

kbuild:
	@$(MAKE) -C kernel

kload: kbuild
	@sudo insmod kernel/build/glassbox.ko

kunload:
	@sudo rmmod glassbox

gotest:
	@cd bridge && go test -count=1 -v ./...

gorun:
	@cd bridge && go run main.go

webtest:
	@cd webapp && npm test
