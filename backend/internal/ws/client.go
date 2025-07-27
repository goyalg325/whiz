package ws

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
	"github.com/goyalg325/whiz/backend/internal/db"
)

type Client struct {
	Conn     *websocket.Conn
	Message  chan *Message
	ID       string `json:"id"`
	RoomID   string `json:"roomId"`
	Username string `json:"username"`
}

type Message struct {
	Content   string `json:"content"`
	RoomID    string `json:"roomId"`
	Username  string `json:"username"`
	Timestamp string `json:"timestamp,omitempty"`
	IsSystem  bool   `json:"isSystem,omitempty"`
}

// IncomingMessage represents the structure of messages sent from the frontend
type IncomingMessage struct {
	Type      string      `json:"type"`
	ChannelID string      `json:"channel_id"`
	UserID    string      `json:"user_id"`
	Username  string      `json:"username"`
	Content   interface{} `json:"content"`
}

func (c *Client) writeMessage() {
	defer func() {
		c.Conn.Close()
	}()

	for {
		message, ok := <-c.Message
		if !ok {
			return
		}

		c.Conn.WriteJSON(message)
	}
}

func (c *Client) readMessage(hub *Hub, database *db.Database) {
	defer func() {
		hub.Unregister <- c
		c.Conn.Close()
	}()

	for {
		_, m, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// Try to parse as JSON first
		var incomingMsg IncomingMessage
		if err := json.Unmarshal(m, &incomingMsg); err == nil {
			// Successfully parsed as JSON - extract content
			var content string

			// Handle different content types
			if contentMap, ok := incomingMsg.Content.(map[string]interface{}); ok {
				// If content is an object, extract the actual content field
				if actualContent, exists := contentMap["content"]; exists {
					content = actualContent.(string)
				} else {
					content = string(m) // fallback to raw message
				}
			} else if contentStr, ok := incomingMsg.Content.(string); ok {
				// If content is already a string
				content = contentStr
			} else {
				// Fallback to raw message
				content = string(m)
			}

			log.Printf("Parsed message - Type: %s, Content: %s, Username: %s, RoomID: %s",
				incomingMsg.Type, content, c.Username, c.RoomID)

			// Debug logging to track roomId
			log.Printf("DEBUG: About to save message with roomId='%s' (type %T) from client with RoomID='%s'",
				c.RoomID, c.RoomID, c.RoomID)

			// Save the extracted content to the database
			if err := database.SaveMessage(content, c.Username, c.RoomID); err != nil {
				log.Printf("Error saving message to database: %v", err)
			}

			msg := &Message{
				Content:   content,
				RoomID:    c.RoomID,
				Username:  c.Username,
				Timestamp: time.Now().Format(time.RFC3339),
			}

			hub.Broadcast <- msg
		} else {
			// Fallback to treating as plain text
			content := string(m)
			log.Printf("Treating as plain text: %s", content)

			// Save the message to the database
			if err := database.SaveMessage(content, c.Username, c.RoomID); err != nil {
				log.Printf("Error saving message to database: %v", err)
			}

			msg := &Message{
				Content:   content,
				RoomID:    c.RoomID,
				Username:  c.Username,
				Timestamp: time.Now().Format(time.RFC3339),
			}

			hub.Broadcast <- msg
		}
	}
}
