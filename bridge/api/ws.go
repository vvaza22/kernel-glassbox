package api

import (
	"bridge/app"
	"bridge/model"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

func (a *API) initWS() {
	a.router.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	a.router.Get("/ws", websocket.New(handleWS))
}

func handleWS(conn *websocket.Conn) {
	application, err := getApp(conn)
	if err != nil {
		// TODO: Add logging
		return
	}

	// Add new client to the application
	writeCh := make(chan model.WSMessage, model.WSChannelBufferSize)
	listener := application.AddClient(&model.WSContext{
		// Ownership of the write channel is transferred to the application
		WriteCh: writeCh,
	})

	go func(ch <-chan model.WSMessage) {
		// Write to client
		for msg := range ch {
			if err := conn.WriteJSON(msg); err != nil {
				// TODO: Add logging
				break
			}
		}
	}(writeCh)

	// Read from client
	for {
		msg := model.WSMessage{}
		if err := conn.ReadJSON(&msg); err != nil {
			// TODO: Add logging
			break
		}
		listener.OnClientMessage(msg)
	}
	application.RemoveClient(listener.ID())
}

func getApp(conn *websocket.Conn) (app.App, error) {
	appCtx := conn.Locals(LocalKeyApp)
	if appCtx == nil {
		return nil, errors.New("app context not found in websocket connection")
	}
	application, ok := appCtx.(app.App)
	if !ok {
		return nil, errors.New("invalid app context type in websocket connection")
	}
	return application, nil
}
