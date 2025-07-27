package main

import (
	"log"

	"github.com/goyalg325/whiz/backend/internal/db"
	"github.com/goyalg325/whiz/backend/internal/user"
	"github.com/goyalg325/whiz/backend/internal/ws"
	"github.com/goyalg325/whiz/backend/router"
)

func main() {
	dbConn, err := db.NewDatabase()
	if err != nil {
		log.Fatalf("could not initialize database connection: %s", err)
	}

	// Clean up any numeric channels that were created by mistake
	if err := dbConn.CleanupNumericChannels(); err != nil {
		log.Printf("Warning: Failed to cleanup numeric channels: %v", err)
	}

	userRep := user.NewRepository(dbConn.GetDB())
	userSvc := user.NewService(userRep)
	userHandler := user.NewHandler(userSvc)

	hub := ws.NewHub()
	wsHandler := ws.NewHandler(hub, dbConn)
	go hub.Run()

	router.InitRouter(userHandler, wsHandler)
	router.Start("0.0.0.0:8080")
}
