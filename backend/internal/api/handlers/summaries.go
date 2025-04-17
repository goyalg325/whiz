package handlers

import (
	"context"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/goyalg325/whiz/backend/internal/ai"

	"github.com/go-chi/chi/v5"
)

type SummaryResponse struct {
	ChannelID int       `json:"channel_id"`
	Content   string    `json:"content"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

func GetChannelSummary(w http.ResponseWriter, r *http.Request) {
	channelID, err := strconv.Atoi(chi.URLParam(r, "channelID"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid channel ID")
		return
	}

	// Check if Gemini client is initialized
	if geminiClient == nil {
		log.Printf("ERROR: Gemini client is not initialized")
		respondWithError(w, http.StatusInternalServerError, "AI service not available")
		return
	}

	// TODO: Get real channel info
	channelName := "channel-" + strconv.Itoa(channelID)

	// Define time range (last 24 hours for example)
	endTime := time.Now()
	startTime := endTime.Add(-24 * time.Hour)

	// Mock messages for testing
	messages := []ai.Message{
		{
			ID:        1,
			UserID:    1,
			Username:  "user1",
			Content:   "Hello everyone!",
			Timestamp: time.Now().Add(-23 * time.Hour),
		},
		{
			ID:        2,
			UserID:    2,
			Username:  "user2",
			Content:   "Hi there! What's everyone working on today?",
			Timestamp: time.Now().Add(-22 * time.Hour),
		},
		{
			ID:        3,
			UserID:    1,
			Username:  "user1",
			Content:   "I'm working on the new feature",
			Timestamp: time.Now().Add(-21 * time.Hour),
		},
	}

	// Request for AI service
	req := ai.SummaryRequest{
		Messages:    messages,
		StartTime:   startTime,
		EndTime:     endTime,
		ChannelName: channelName,
	}

	log.Printf("Generating summary for channel %d with %d messages", channelID, len(messages))

	// Generate summary using Gemini
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	summaryText, err := geminiClient.GenerateSummary(ctx, req)
	if err != nil {
		log.Printf("ERROR generating summary: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to generate summary: "+err.Error())
		return
	}

	response := SummaryResponse{
		ChannelID: channelID,
		Content:   summaryText,
		StartTime: startTime,
		EndTime:   endTime,
	}

	respondWithJSON(w, http.StatusOK, response)
}

func GetMissedMessagesSummary(w http.ResponseWriter, r *http.Request) {
	_, err := strconv.Atoi(chi.URLParam(r, "userID"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	channelID, err := strconv.Atoi(chi.URLParam(r, "channelID"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid channel ID")
		return
	}

	// Check if Gemini client is initialized
	if geminiClient == nil {
		log.Printf("ERROR: Gemini client is not initialized")
		respondWithError(w, http.StatusInternalServerError, "AI service not available")
		return
	}

	// TODO: Get real channel info
	channelName := "channel-" + strconv.Itoa(channelID)

	// TODO: Get user's last seen timestamp from database
	lastSeen := time.Now().Add(-12 * time.Hour) // Mock last seen time
	endTime := time.Now()

	// Mock messages for testing
	messages := []ai.Message{
		{
			ID:        4,
			UserID:    3,
			Username:  "user3",
			Content:   "Has anyone looked at the latest deployment?",
			Timestamp: time.Now().Add(-10 * time.Hour),
		},
		{
			ID:        5,
			UserID:    2,
			Username:  "user2",
			Content:   "Yes, I noticed some issues with the API",
			Timestamp: time.Now().Add(-9 * time.Hour),
		},
		{
			ID:        6,
			UserID:    3,
			Username:  "user3",
			Content:   "I'll create a ticket to track the fixes needed",
			Timestamp: time.Now().Add(-8 * time.Hour),
		},
	}

	// Request for AI service
	req := ai.SummaryRequest{
		Messages:    messages,
		StartTime:   lastSeen,
		EndTime:     endTime,
		ChannelName: channelName,
	}

	log.Printf("Generating missed messages summary for channel %d with %d messages", channelID, len(messages))

	// Generate missed messages summary using Gemini
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	summaryText, err := geminiClient.GenerateMissedMessagesSummary(ctx, req)
	if err != nil {
		log.Printf("ERROR generating missed messages summary: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Failed to generate summary: "+err.Error())
		return
	}

	response := SummaryResponse{
		ChannelID: channelID,
		Content:   summaryText,
		StartTime: lastSeen,
		EndTime:   endTime,
	}

	respondWithJSON(w, http.StatusOK, response)
}
