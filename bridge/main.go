package main

import (
	"bridge/server"
	"context"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	srv, err := server.NewServer()
	fatal(err)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		fatal(srv.Start())
	}()

	// Wait for system interrupt to gracefully shutdown the server
	<-ctx.Done()

	fatal(srv.Destroy())
}

func fatal(err error) {
	if err != nil {
		panic(err.Error())
	}
}
