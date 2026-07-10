package main

import (
	"fmt"
	"log"
	"os"

	"api-go/handlers"
	"api-go/middleware"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	app := fiber.New()
	app.Use(cors.New())
	api := app.Group("/api")
	// Proteger rutas de matriz con JWT
	matrixGroup := api.Group("/matrix")
	matrixGroup.Use(middleware.JWTProtected())
	matrixGroup.Post("/rotate", handlers.RotateMatrix)
	// Calculo Metodo de factorización QR Householder
	matrixGroup.Post("/qrHouseholder", handlers.QRHouseholder)
	// Calculo Metodo de factorización QR Gram-Schmidt
	matrixGroup.Post("/qrGramSchmidt", handlers.QRMatrixGramSchmidt)
	// Calculo Metodo de factorización QR Givens
	matrixGroup.Post("/qrGivens", handlers.QRMatrixGivens)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Fatal(app.Listen(fmt.Sprintf(":%s", port)))
}
