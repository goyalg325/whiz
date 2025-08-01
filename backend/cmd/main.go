package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/goyalg325/whiz/backend/internal/api"
	"github.com/goyalg325/whiz/backend/internal/db"
	"github.com/goyalg325/whiz/backend/internal/user"
	"github.com/goyalg325/whiz/backend/internal/ws"
	"github.com/goyalg325/whiz/backend/router"
	"github.com/joho/godotenv"
)

func main() {
	// Get current working directory for debugging
	wd, _ := os.Getwd()
	log.Printf("Current working directory: %s", wd)

	// Load environment variables from .env file
	// Try multiple possible locations for the .env file
	envPaths := []string{
		".env",                    // Current directory
		"../.env",                 // Parent directory
		filepath.Join(wd, ".env"), // Absolute path in current dir
	}

	loaded := false
	for _, envPath := range envPaths {
		if err := godotenv.Load(envPath); err == nil {
			log.Printf("Successfully loaded .env file from: %s", envPath)
			loaded = true
			break
		}
	}

	if !loaded {
		log.Printf("Warning: Could not load .env file from any location")
		log.Printf("Tried: %v", envPaths)
		log.Printf("Continuing with system environment variables...")
	}

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

	// Initialize AI handler
	aiHandler := api.NewAIHandler(dbConn)

	hub := ws.NewHub()
	wsHandler := ws.NewHandler(hub, dbConn)
	go hub.Run()

	router.InitRouter(userHandler, wsHandler, aiHandler)
	router.Start("0.0.0.0:8080")
}
