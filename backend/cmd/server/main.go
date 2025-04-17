package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"

	"github.com/goyalg325/whiz/backend/internal/ai"
	"github.com/goyalg325/whiz/backend/internal/api/handlers"
	"github.com/goyalg325/whiz/backend/internal/db"
	"github.com/goyalg325/whiz/backend/internal/ws"
)

func main() {
	// Load environment variables from .env file
	loadEnvFile()

	// Initialize router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Get environment variables or use defaults
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort, _ := strconv.Atoi(getEnv("DB_PORT", "5432"))
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "whiz")
	geminiAPIKey := getEnv("GEMINI_API_KEY", "")
	port := getEnv("PORT", "8080")
	wsPort := getEnv("WS_PORT", "8081")

	// Initialize AI client
	if geminiAPIKey == "" {
		log.Println("WARNING: No Gemini API key provided. AI features will use mock responses.")
	} else {
		keyLength := len(geminiAPIKey)
		if keyLength < 10 {
			log.Println("WARNING: Gemini API key looks too short. Please check your .env file.")
		} else {
			firstFew := geminiAPIKey[:4]
			lastFew := geminiAPIKey[keyLength-4:]
			log.Printf("Gemini API key configured successfully [%s...%s] (length: %d characters)", firstFew, lastFew, keyLength)
		}
	}

	// Create and set the Gemini client
	geminiClient := ai.NewGeminiClient(geminiAPIKey)
	handlers.SetGeminiClient(geminiClient)

	// Initialize database
	err := db.InitDB(db.Config{
		Host:     dbHost,
		Port:     dbPort,
		User:     dbUser,
		Password: dbPassword,
		DBName:   dbName,
	})
	if err != nil {
		log.Printf("Warning: Database connection failed: %v", err)
		log.Println("Continuing without database connection for demo purposes")
	} else {
		defer db.CloseDB()
	}

	// Initialize WebSocket server
	wsServer := ws.NewServer()
	go wsServer.Start()
	go wsServer.ListenTCP(":" + wsPort)

	// Routes
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Welcome to Whiz API"))
	})

	// API routes
	r.Route("/api", func(r chi.Router) {
		r.Route("/channels", func(r chi.Router) {
			r.Get("/", handlers.GetAllChannels)
			r.Post("/", handlers.CreateChannel)
			r.Route("/{channelID}", func(r chi.Router) {
				r.Get("/", handlers.GetChannelByID)
				r.Put("/", handlers.UpdateChannel)
				r.Delete("/", handlers.DeleteChannel)
			})
		})

		r.Route("/messages", func(r chi.Router) {
			r.Get("/", handlers.GetAllMessages)
			r.Post("/", handlers.CreateMessage)
			r.Route("/{messageID}", func(r chi.Router) {
				r.Get("/", handlers.GetMessageByID)
				r.Put("/", handlers.UpdateMessage)
				r.Delete("/", handlers.DeleteMessage)
				r.Get("/context", handlers.GetMessageContext)
			})
		})

		r.Route("/summaries", func(r chi.Router) {
			r.Get("/channel/{channelID}", handlers.GetChannelSummary)
			r.Get("/missed/{userID}/{channelID}", handlers.GetMissedMessagesSummary)
		})
	})

	log.Println("Server starting on port " + port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

// Helper function to get environment variables with defaults
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// Helper function to load .env file
func loadEnvFile() {
	envFile := filepath.Join(".", ".env")
	// Try different paths if the file is not found
	if _, err := os.Stat(envFile); os.IsNotExist(err) {
		envFile = filepath.Join("..", ".env")
		if _, err := os.Stat(envFile); os.IsNotExist(err) {
			envFile = filepath.Join("..", "..", ".env")
		}
	}

	err := godotenv.Load(envFile)
	if err != nil {
		log.Println("Warning: .env file not found or could not be loaded. Using default environment variables.")
	} else {
		log.Printf("Loaded environment variables from %s", envFile)
	}
}
