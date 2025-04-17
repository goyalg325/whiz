package ws

import (
	"bufio"
	"encoding/json"
	"log"
	"net"
	"sync"
)

type Message struct {
	Type      string      `json:"type"`
	ChannelID int         `json:"channel_id"`
	UserID    int         `json:"user_id"`
	Content   interface{} `json:"content"`
}

type Client struct {
	ID     int
	Conn   net.Conn
	Server *Server
}

type Server struct {
	Clients    map[int]*Client
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan Message
	mu         sync.Mutex
}

func NewServer() *Server {
	return &Server{
		Clients:    make(map[int]*Client),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan Message),
	}
}

func (s *Server) Start() {
	for {
		select {
		case client := <-s.Register:
			s.mu.Lock()
			s.Clients[client.ID] = client
			s.mu.Unlock()
			log.Printf("Client %d connected", client.ID)

		case client := <-s.Unregister:
			s.mu.Lock()
			if _, ok := s.Clients[client.ID]; ok {
				delete(s.Clients, client.ID)
				close := client.Conn.Close()
				if close != nil {
					log.Printf("Error closing connection for client %d: %v", client.ID, close)
				}
			}
			s.mu.Unlock()
			log.Printf("Client %d disconnected", client.ID)

		case message := <-s.Broadcast:
			for _, client := range s.Clients {
				err := json.NewEncoder(client.Conn).Encode(message)
				if err != nil {
					log.Printf("Error broadcasting to client %d: %v", client.ID, err)
					client.Conn.Close()
					s.Unregister <- client
				}
			}
		}
	}
}

func (s *Server) ListenTCP(address string) {
	listener, err := net.Listen("tcp", address)
	if err != nil {
		log.Fatalf("Error starting TCP server: %v", err)
	}
	defer listener.Close()

	log.Printf("WebSocket server started on %s", address)

	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Printf("Error accepting connection: %v", err)
			continue
		}

		// Generate unique client ID (in real app, this would come from auth)
		clientID := len(s.Clients) + 1
		client := &Client{
			ID:     clientID,
			Conn:   conn,
			Server: s,
		}

		s.Register <- client

		go s.handleClient(client)
	}
}

func (s *Server) handleClient(client *Client) {
	defer func() {
		s.Unregister <- client
	}()

	reader := bufio.NewReader(client.Conn)

	for {
		data, err := reader.ReadBytes('\n')
		if err != nil {
			log.Printf("Error reading from client %d: %v", client.ID, err)
			break
		}

		var message Message
		if err := json.Unmarshal(data, &message); err != nil {
			log.Printf("Error unmarshalling message: %v", err)
			continue
		}

		s.Broadcast <- message
	}
}

func (c *Client) SendMessage(message Message) {
	err := json.NewEncoder(c.Conn).Encode(message)
	if err != nil {
		log.Printf("Error sending message to client %d: %v", c.ID, err)
		c.Server.Unregister <- c
	}
}
