package api

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/goyalg325/whiz/backend/internal/ai"
	"github.com/goyalg325/whiz/backend/internal/db"
)

type AIHandler struct {
	db       *db.Database
	aiClient *ai.GeminiClient
}

func NewAIHandler(database *db.Database) *AIHandler {
	apiKey := os.Getenv("GEMINI_API_KEY")
	log.Printf("AI Handler initialization - API key length: %d", len(apiKey))
	if len(apiKey) > 0 {
		log.Printf("API key starts with: %s...", apiKey[:min(10, len(apiKey))])
	} else {
		log.Printf("WARNING: GEMINI_API_KEY environment variable is empty!")
	}

	aiClient := ai.NewGeminiClient(apiKey)

	return &AIHandler{
		db:       database,
		aiClient: aiClient,
	}
}

// Helper function for safe substring
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// GetMessageContext generates AI context for a specific message
func (h *AIHandler) GetMessageContext(c *gin.Context) {
	messageIdStr := c.Param("messageId")
	log.Printf("AI Context request for message ID: %s", messageIdStr)

	messageId, err := strconv.Atoi(messageIdStr)
	if err != nil {
		log.Printf("Invalid message ID: %s, error: %v", messageIdStr, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID"})
		return
	}

	// Get the message and its thread context from database
	log.Printf("Getting message and thread for ID: %d", messageId)
	message, thread, err := h.getMessageWithThread(messageId)
	if err != nil {
		log.Printf("Failed to get message with thread: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		return
	}

	log.Printf("Found message: %s, thread length: %d", message.Content, len(thread))

	// Create context request
	req := ai.ContextRequest{
		MessageID:   messageId,
		MessageText: message.Content,
		Thread:      thread,
	}

	// Generate AI context
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	log.Printf("Generating AI context...")
	contextText, err := h.aiClient.GenerateMessageContext(ctx, req)
	if err != nil {
		log.Printf("Failed to generate AI context: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate context"})
		return
	}

	log.Printf("Successfully generated AI context: %s", contextText)
	c.JSON(http.StatusOK, gin.H{
		"context":   contextText,
		"messageId": messageId,
	})
}

// GetChannelSummary generates a summary for a channel
func (h *AIHandler) GetChannelSummary(c *gin.Context) {
	channelName := c.Param("channelName")

	// Get recent messages from the channel (last 24 hours)
	endTime := time.Now()
	startTime := endTime.Add(-24 * time.Hour)

	messages, err := h.getChannelMessagesInTimeRange(channelName, startTime, endTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve messages"})
		return
	}

	if len(messages) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"summary":     "No messages found in the last 24 hours.",
			"channelName": channelName,
		})
		return
	}

	// Create summary request
	req := ai.SummaryRequest{
		Messages:    messages,
		StartTime:   startTime,
		EndTime:     endTime,
		ChannelName: channelName,
	}

	// Generate AI summary
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	summary, err := h.aiClient.GenerateSummary(ctx, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate summary"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"summary":      summary,
		"channelName":  channelName,
		"messageCount": len(messages),
		"timeRange": gin.H{
			"start": startTime.Format("2006-01-02 15:04:05"),
			"end":   endTime.Format("2006-01-02 15:04:05"),
		},
	})
}

// GetMissedMessagesSummary generates a summary of missed messages for a user in a specific channel
func (h *AIHandler) GetMissedMessagesSummary(c *gin.Context) {
	username := c.Param("username")
	channelName := c.Param("channelName")
	log.Printf("Getting missed messages summary for user %s in channel %s", username, channelName)

	// Get unread messages for this specific channel only
	unreadMessages, err := h.db.GetUnreadMessages(username, channelName)
	if err != nil {
		log.Printf("Failed to get unread messages for user %s in channel %s: %v", username, channelName, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve unread messages"})
		return
	}

	if len(unreadMessages) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"summary":     "No new messages in this channel since your last visit. You're all caught up! 🎉",
			"username":    username,
			"channelName": channelName,
			"totalCount":  0,
		})
		return
	}

	// Convert unread messages to AI format
	var aiMessages []ai.Message
	for _, rawMsg := range unreadMessages {
		timestamp, err := time.Parse("2006-01-02T15:04:05.999999999Z07:00", rawMsg["timestamp"].(string))
		if err != nil {
			// Try alternative format
			timestamp, err = time.Parse(time.RFC3339, rawMsg["timestamp"].(string))
			if err != nil {
				timestamp = time.Now()
			}
		}

		message := ai.Message{
			ID:        rawMsg["id"].(int),
			Content:   rawMsg["content"].(string),
			Username:  rawMsg["username"].(string),
			Timestamp: timestamp,
		}
		aiMessages = append(aiMessages, message)
	}

	// Generate AI summary for this channel's missed messages
	req := ai.SummaryRequest{
		Messages:    aiMessages,
		ChannelName: channelName,
		StartTime:   aiMessages[0].Timestamp,
		EndTime:     aiMessages[len(aiMessages)-1].Timestamp,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	summary, err := h.aiClient.GenerateMissedMessagesSummary(ctx, req)
	if err != nil {
		log.Printf("Error generating summary for channel %s: %v", channelName, err)
		summary = fmt.Sprintf("Found %d new messages in #%s. AI summary temporarily unavailable.", len(unreadMessages), channelName)
	}

	c.JSON(http.StatusOK, gin.H{
		"summary":     summary,
		"username":    username,
		"channelName": channelName,
		"totalCount":  len(unreadMessages),
		"messages":    unreadMessages,
	})
} // UpdateUserActivity marks messages as read for a user
func (h *AIHandler) UpdateUserActivity(c *gin.Context) {
	username := c.Param("username")
	channelName := c.Param("channelName")
	messageIdStr := c.Param("messageId")

	messageId, err := strconv.Atoi(messageIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID"})
		return
	}

	err = h.db.UpdateUserLastSeen(username, channelName, messageId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user activity"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":           "User activity updated successfully",
		"username":          username,
		"channelName":       channelName,
		"lastSeenMessageId": messageId,
	})
}

// Helper function to get message with thread context
func (h *AIHandler) getMessageWithThread(messageId int) (*ai.Message, []ai.Message, error) {
	// Get all messages from the same channel around the target message time
	query := `
		SELECT id, content, username, created_at
		FROM messages m
		WHERE m.channel_id = (
			SELECT channel_id FROM messages WHERE id = $1
		)
		ORDER BY created_at ASC
	`

	rows, err := h.db.GetDB().Query(query, messageId)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to query messages: %v", err)
	}
	defer rows.Close()

	var allMessages []ai.Message
	var targetMessage *ai.Message

	for rows.Next() {
		var id int
		var content, username, createdAt string
		if err := rows.Scan(&id, &content, &username, &createdAt); err != nil {
			return nil, nil, fmt.Errorf("failed to scan message: %v", err)
		}

		// Parse timestamp
		timestamp, err := time.Parse(time.RFC3339, createdAt)
		if err != nil {
			// Try alternative format
			timestamp, err = time.Parse("2006-01-02T15:04:05.999999999Z07:00", createdAt)
			if err != nil {
				timestamp = time.Now() // fallback
			}
		}

		message := ai.Message{
			ID:        id,
			Content:   content,
			Username:  username,
			Timestamp: timestamp,
		}

		allMessages = append(allMessages, message)

		// Track the target message
		if id == messageId {
			targetMessage = &message
		}
	}

	if targetMessage == nil {
		return nil, nil, fmt.Errorf("message with ID %d not found", messageId)
	}

	return targetMessage, allMessages, nil
}

// Helper function to get channel messages in time range
func (h *AIHandler) getChannelMessagesInTimeRange(channelName string, startTime, endTime time.Time) ([]ai.Message, error) {
	// Get messages from database
	rawMessages, err := h.db.GetRoomMessages(channelName)
	if err != nil {
		return nil, err
	}

	// Convert to AI message format and filter by time
	var messages []ai.Message
	for _, rawMsg := range rawMessages {
		// Parse timestamp
		timestampStr, ok := rawMsg["timestamp"].(string)
		if !ok {
			continue
		}

		timestamp, err := time.Parse(time.RFC3339, timestampStr)
		if err != nil {
			// Try alternative timestamp format
			timestamp, err = time.Parse("2006-01-02T15:04:05.999999999Z07:00", timestampStr)
			if err != nil {
				continue
			}
		}

		// Filter by time range
		if timestamp.After(startTime) && timestamp.Before(endTime) {
			message := ai.Message{
				Content:   rawMsg["content"].(string),
				Username:  rawMsg["username"].(string),
				Timestamp: timestamp,
			}
			messages = append(messages, message)
		}
	}

	return messages, nil
}
