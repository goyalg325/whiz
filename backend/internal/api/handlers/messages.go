package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/goyalg325/whiz/backend/internal/ai"

	"github.com/go-chi/chi/v5"
)

type MessageResponse struct {
	ID        int       `json:"id"`
	ChannelID int       `json:"channel_id"`
	UserID    int       `json:"user_id"`
	Username  string    `json:"username"`
	ParentID  *int      `json:"parent_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type MessageRequest struct {
	ChannelID int    `json:"channel_id"`
	ParentID  *int   `json:"parent_id"`
	Content   string `json:"content"`
}

type MessageContextResponse struct {
	ID      int    `json:"id"`
	Context string `json:"context"`
}

// Mock dependency for AI client
var geminiClient *ai.GeminiClient

// SetGeminiClient allows setting the Gemini client from outside this package
func SetGeminiClient(client *ai.GeminiClient) {
	geminiClient = client
}

func init() {
	// Initialize with a default client if not set externally
	if geminiClient == nil {
		geminiClient = ai.NewGeminiClient("mock-api-key")
	}
}

func GetAllMessages(w http.ResponseWriter, r *http.Request) {
	channelID := r.URL.Query().Get("channel_id")
	if channelID == "" {
		respondWithError(w, http.StatusBadRequest, "Channel ID is required")
		return
	}

	// TODO: Implement database fetching

	messages := []MessageResponse{
		{
			ID:        1,
			ChannelID: 1,
			UserID:    1,
			Username:  "user1",
			Content:   "Hello world!",
			CreatedAt: time.Now().Add(-1 * time.Hour),
		},
		{
			ID:        2,
			ChannelID: 1,
			UserID:    2,
			Username:  "user2",
			Content:   "Hi there!",
			CreatedAt: time.Now().Add(-30 * time.Minute),
		},
	}

	respondWithJSON(w, http.StatusOK, messages)
}

func CreateMessage(w http.ResponseWriter, r *http.Request) {
	var req MessageRequest

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// TODO: Get user info from auth context
	userID := 1
	username := "user1"

	// TODO: Insert into database

	message := MessageResponse{
		ID:        100, // Mock ID
		ChannelID: req.ChannelID,
		UserID:    userID,
		Username:  username,
		ParentID:  req.ParentID,
		Content:   req.Content,
		CreatedAt: time.Now(),
	}

	respondWithJSON(w, http.StatusCreated, message)
}

func GetMessageByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "messageID"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid message ID")
		return
	}

	// TODO: Get from database

	message := MessageResponse{
		ID:        id,
		ChannelID: 1,
		UserID:    1,
		Username:  "user1",
		Content:   "This is message " + strconv.Itoa(id),
		CreatedAt: time.Now().Add(-1 * time.Hour),
	}

	respondWithJSON(w, http.StatusOK, message)
}

func UpdateMessage(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "messageID"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid message ID")
		return
	}

	var req struct {
		Content string `json:"content"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// TODO: Update in database

	message := MessageResponse{
		ID:        id,
		ChannelID: 1,
		UserID:    1,
		Username:  "user1",
		Content:   req.Content,
		CreatedAt: time.Now().Add(-1 * time.Hour),
	}

	respondWithJSON(w, http.StatusOK, message)
}

func DeleteMessage(w http.ResponseWriter, r *http.Request) {
	_, err := strconv.Atoi(chi.URLParam(r, "messageID"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid message ID")
		return
	}

	// TODO: Delete from database

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Message deleted successfully"})
}

func GetMessageContext(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "messageID"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid message ID")
		return
	}

	// Check if Gemini client is initialized
	if geminiClient == nil {
		log.Printf("ERROR: Gemini client is not initialized")
		respondWithError(w, http.StatusInternalServerError, "AI service not available")
		return
	}

	// In a real app, we'd get the message from the database
	// For demo, we'll create a mock message
	messageText := "What do you think about the new feature?"

	// Create mock thread for context
	thread := []ai.Message{
		{
			ID:        id - 2,
			UserID:    1,
			Username:  "user1",
			Content:   "I've been working on a new feature for our app",
			Timestamp: time.Now().Add(-30 * time.Minute),
		},
		{
			ID:        id - 1,
			UserID:    2,
			Username:  "user2",
			Content:   "Oh really? What does it do?",
			Timestamp: time.Now().Add(-25 * time.Minute),
		},
		{
			ID:        id,
			UserID:    1,
			Username:  "user1",
			Content:   messageText,
			Timestamp: time.Now().Add(-20 * time.Minute),
		},
	}

	// Create a context request for the AI service
	req := ai.ContextRequest{
		MessageID:   id,
		MessageText: messageText,
		Thread:      thread,
	}

	log.Printf("Generating context for message %d with thread of %d messages", id, len(thread))

	// Generate context using Gemini
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	contextText, err := geminiClient.GenerateMessageContext(ctx, req)
	if err != nil {
		log.Printf("ERROR generating message context: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to generate context: "+err.Error())
		return
	}

	response := MessageContextResponse{
		ID:      id,
		Context: contextText,
	}

	respondWithJSON(w, http.StatusOK, response)
}
