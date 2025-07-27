package ws

import "log"

type Room struct {
	ID      string             `json:"id"`
	Name    string             `json:"name"`
	Clients map[string]*Client `json:"clients"`
}

type Hub struct {
	Rooms      map[string]*Room
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan *Message
}

func NewHub() *Hub {
	return &Hub{
		Rooms:      make(map[string]*Room),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan *Message, 5),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case cl := <-h.Register:
			log.Printf("Registering client %s to room %s", cl.ID, cl.RoomID)
			if _, ok := h.Rooms[cl.RoomID]; ok {
				r := h.Rooms[cl.RoomID]

				if _, ok := r.Clients[cl.ID]; !ok {
					r.Clients[cl.ID] = cl
					log.Printf("Client %s successfully registered to room %s", cl.ID, cl.RoomID)
				}
			} else {
				// Create the room if it doesn't exist
				log.Printf("Room %s doesn't exist, creating it", cl.RoomID)
				h.Rooms[cl.RoomID] = &Room{
					ID:      cl.RoomID,
					Name:    cl.RoomID,
					Clients: make(map[string]*Client),
				}
				h.Rooms[cl.RoomID].Clients[cl.ID] = cl
				log.Printf("Created room %s and registered client %s", cl.RoomID, cl.ID)
			}
		case cl := <-h.Unregister:
			if _, ok := h.Rooms[cl.RoomID]; ok {
				if _, ok := h.Rooms[cl.RoomID].Clients[cl.ID]; ok {
					if len(h.Rooms[cl.RoomID].Clients) != 0 {
						h.Broadcast <- &Message{
							Content:  "user left the chat",
							RoomID:   cl.RoomID,
							Username: cl.Username,
						}
					}

					delete(h.Rooms[cl.RoomID].Clients, cl.ID)
					close(cl.Message)
				}
			}

		case m := <-h.Broadcast:
			if _, ok := h.Rooms[m.RoomID]; ok {
				log.Printf("Broadcasting message to room %s: content='%s', username='%s'", m.RoomID, m.Content, m.Username)
				clientCount := len(h.Rooms[m.RoomID].Clients)
				log.Printf("Room %s has %d clients", m.RoomID, clientCount)

				for clientID, cl := range h.Rooms[m.RoomID].Clients {
					log.Printf("Sending message to client %s", clientID)
					cl.Message <- m
				}
			} else {
				log.Printf("Room %s not found for broadcasting message", m.RoomID)
			}
		}
	}
}
