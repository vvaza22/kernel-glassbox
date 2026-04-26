package server

import (
	"bridge/api"
	"bridge/app"
	"bridge/config"
	"bridge/nlclient"

	"github.com/gofiber/fiber/v2"
	"github.com/pkg/errors"
)

type Server interface {
	Start() error
	Destroy() error
}

type server struct {
	router *fiber.App
	nl     nlclient.NetlinkClient
	app    app.App
	api    *api.API
}

func NewServer() (Server, error) {
	srv := &server{}
	srv.router = fiber.New()

	// Initialize netlink connection
	nl, err := nlclient.NewNetlinkClient()
	if err != nil {
		return nil, err
	}
	srv.nl = nl
	srv.app = app.NewApp(nl)
	srv.api = api.Init(srv.router, srv.app)

	return srv, nil
}

func (s *server) Start() error {
	return s.router.Listen(config.ListenAddress)
}

func (s *server) Destroy() error {
	// Shutdown fiber first to stop accepting new requests
	err := s.router.Shutdown()
	if err != nil {
		return errors.Wrap(err, "failed to shutdown router")
	}

	err = s.nl.Destroy()
	if err != nil {
		return errors.Wrap(err, "failed to destroy netlink client")
	}

	return nil
}
