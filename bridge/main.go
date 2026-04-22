package main

import (
	"bridge/nlclient"
	"fmt"
)

func Fatal(err error) {
	if err != nil {
		panic(err.Error())
	}
}

func main() {
	nl, err := nlclient.NewNetlinkClient()
	Fatal(err)
	defer nl.Destroy()

	proctreeClient := nl.Proctree()
	nodes, err := proctreeClient.Dump()
	Fatal(err)

	for _, node := range nodes {
		fmt.Println(node)
	}
}
