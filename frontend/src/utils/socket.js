class SocketClient {
  constructor(roomId, username) {
    console.log("SocketClient constructor called with:", {
      roomId: roomId,
      roomIdType: typeof roomId,
      username: username
    });
    
    this.roomId = roomId;
    this.username = username;
    
    // Make sure roomId is defined and not empty
    if (roomId && roomId !== 'undefined' && roomId !== 'null') {
      // Include required query parameters for the WebSocket connection
      const userId = username || 'anonymous'; // Fallback if username is not provided
      
      // The backend expects the URL format: /ws/joinRoom/:roomId with userId and username as query parameters
      this.url = `ws://localhost:8080/ws/joinRoom/${roomId}?userId=${encodeURIComponent(userId)}&username=${encodeURIComponent(username)}`;
      
      console.log("WebSocket URL configured:", this.url);
    } else {
      console.error("Invalid roomId provided to SocketClient:", roomId);
      this.url = null;
    }
    
    this.socket = null;
    this.messageHandlers = [];
    this.connectionHandlers = {
      onConnect: [],
      onDisconnect: [],
    };
  }

  connect() {
    try {
      // Check if we have a valid URL
      if (!this.url) {
        console.error("Cannot connect: WebSocket URL is not valid");
        return;
      }
      
      console.log("Connecting to WebSocket at:", this.url);
      console.log("Room ID:", this.roomId, "Type:", typeof this.roomId);
      
      // Create a WebSocket connection to our server
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log("WebSocket connection established to " + this.url);
        this.connectionHandlers.onConnect.forEach(handler => handler());
      };

      this.socket.onclose = (event) => {
        console.log("WebSocket connection closed with code:", event.code, "reason:", event.reason);
        this.connectionHandlers.onDisconnect.forEach(handler => handler());
        // Attempt to reconnect after 3 seconds
        setTimeout(() => this.connect(), 3000);
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.socket.onmessage = (event) => {
        try {
          // Parse the received message
          const message = JSON.parse(event.data);
          console.log("WebSocket message received:", message);
          
          // Ensure the message has a timestamp
          if (!message.timestamp) {
            message.timestamp = new Date().toISOString();
          }
          
          // Important: process the message regardless of who sent it
          // This ensures we display messages from all users in the room
          
          // Notify all handlers about the new message
          this.messageHandlers.forEach(handler => handler(message));
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      // Attempt to reconnect after 3 seconds
      setTimeout(() => this.connect(), 3000);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  on(handler) {
    if (typeof handler === "function") {
      this.messageHandlers.push(handler);
    }
    return this;
  }

  off(handler) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    return this;
  }

  onConnect(handler) {
    this.connectionHandlers.onConnect.push(handler);
    return this;
  }

  onDisconnect(handler) {
    this.connectionHandlers.onDisconnect.push(handler);
    return this;
  }

  send(message) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error("Cannot send message, socket is not open");
      return;
    }

    // Prepare the full message with all required fields
    const fullMessage = {
      ...message,
      username: this.username,
      roomId: this.roomId,
      timestamp: message.timestamp || new Date().toISOString()
    };

    console.log("Sending message through WebSocket:", fullMessage);

    // Send the message through WebSocket - this will broadcast to all users
    // The backend will then broadcast this to all connected clients
    this.socket.send(JSON.stringify(fullMessage));
  }
}

export default SocketClient;
