package api

import (
	"bridge/app"

	"github.com/gofiber/fiber/v2"
)

const LocalKeyApp = "app"

type API struct {
	router *fiber.App
}

func Init(router *fiber.App, application app.App) *API {
	apiCtx := &API{
		router: router,
	}

	apiCtx.router.Use(func(c *fiber.Ctx) error {
		c.Locals(LocalKeyApp, application)
		return c.Next()
	})

	apiCtx.initWS()

	return apiCtx
}
