package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type ChannelResponse struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type ChannelRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func GetAllChannels(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement database fetching
	// This is a mock implementation
	channels := []ChannelResponse{
		{ID: 1, Name: "general", Description: "General chat"},
		{ID: 2, Name: "random", Description: "Random stuff"},
	}

	respondWithJSON(w, http.StatusOK, channels)
}

func CreateChannel(w http.ResponseWriter, r *http.Request) {
	var req ChannelRequest

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// TODO: Insert into database

	channel := ChannelResponse{
		ID:          3, // Mock ID
		Name:        req.Name,
		Description: req.Description,
	}

	respondWithJSON(w, http.StatusCreated, channel)
}

func GetChannelByID(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "channelID"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid channel ID")
		return
	}

	// TODO: Get from database

	channel := ChannelResponse{
		ID:          id,
		Name:        "channel-" + strconv.Itoa(id),
		Description: "Description for channel " + strconv.Itoa(id),
	}

	respondWithJSON(w, http.StatusOK, channel)
}

func UpdateChannel(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "channelID"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid channel ID")
		return
	}

	var req ChannelRequest

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	defer r.Body.Close()

	// TODO: Update in database

	channel := ChannelResponse{
		ID:          id,
		Name:        req.Name,
		Description: req.Description,
	}

	respondWithJSON(w, http.StatusOK, channel)
}

func DeleteChannel(w http.ResponseWriter, r *http.Request) {
	_, err := strconv.Atoi(chi.URLParam(r, "channelID"))
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid channel ID")
		return
	}

	// TODO: Delete from database

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "Channel deleted successfully"})
}
