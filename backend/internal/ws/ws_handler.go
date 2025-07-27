package ws

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/goyalg325/whiz/backend/internal/db"
)

type Handler struct {
	hub *Hub
	db  *db.Database
}

func NewHandler(h *Hub, database *db.Database) *Handler {
	return &Handler{
		hub: h,
		db:  database,
	}
}

type CreateRoomReq struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (h *Handler) CreateRoom(c *gin.Context) {
	var req CreateRoomReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create the channel in the database
	channelId, err := h.db.CreateChannel(req.Name, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create channel"})
		return
	}

	// Also create the room in memory for WebSocket handling
	h.hub.Rooms[req.Name] = &Room{
		ID:      req.Name,
		Name:    req.Name,
		Clients: make(map[string]*Client),
	}

	// Return the created channel info
	response := map[string]interface{}{
		"id":          channelId,
		"name":        req.Name,
		"description": req.Description,
	}

	c.JSON(http.StatusOK, response)
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h *Handler) JoinRoom(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	roomID := c.Param("roomId")
	clientID := c.Query("userId")
	username := c.Query("username")

	cl := &Client{
		Conn:     conn,
		Message:  make(chan *Message, 10),
		ID:       clientID,
		RoomID:   roomID,
		Username: username,
	}

	m := &Message{
		Content:  "A new user has joined the room",
		RoomID:   roomID,
		Username: username,
		IsSystem: true,
	}

	h.hub.Register <- cl
	h.hub.Broadcast <- m

	go cl.writeMessage()
	cl.readMessage(h.hub, h.db)
}

type RoomRes struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (h *Handler) GetRooms(c *gin.Context) {
	// Get channels from database instead of in-memory map
	channelsData, err := h.db.GetAllChannels()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch channels"})
		return
	}

	rooms := make([]RoomRes, 0)

	for _, channelData := range channelsData {
		// Ensure in-memory room exists for WebSocket handling
		name := channelData["name"].(string)
		if _, exists := h.hub.Rooms[name]; !exists {
			h.hub.Rooms[name] = &Room{
				ID:      name,
				Name:    name,
				Clients: make(map[string]*Client),
			}
		}

		room := RoomRes{
			ID:          channelData["id"].(int),
			Name:        name,
			Description: channelData["description"].(string),
		}
		rooms = append(rooms, room)
	}

	c.JSON(http.StatusOK, rooms)
}

type ClientRes struct {
	ID       string `json:"id"`
	Username string `json:"username"`
}

func (h *Handler) GetClients(c *gin.Context) {
	var clients []ClientRes
	roomId := c.Param("roomId")

	if _, ok := h.hub.Rooms[roomId]; !ok {
		clients = make([]ClientRes, 0)
		c.JSON(http.StatusOK, clients)
	}

	for _, c := range h.hub.Rooms[roomId].Clients {
		clients = append(clients, ClientRes{
			ID:       c.ID,
			Username: c.Username,
		})
	}

	c.JSON(http.StatusOK, clients)
}

// GetRoomMessages returns the message history for a specific room
func (h *Handler) GetRoomMessages(c *gin.Context) {
	roomId := c.Param("roomId")

	messages, err := h.db.GetRoomMessages(roomId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve messages"})
		return
	}

	c.JSON(http.StatusOK, messages)
}
