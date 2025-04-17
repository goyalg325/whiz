class SocketClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.messageHandlers = new Map();
    this.connectionHandlers = {
      onConnect: [],
      onDisconnect: [],
    };
  }

  connect() {
    try {
      // Create a TCP socket connection to our server
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.connectionHandlers.onConnect.forEach(handler => handler());
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
        this.connectionHandlers.onDisconnect.forEach(handler => handler());
        // Attempt to reconnect after 3 seconds
        setTimeout(() => this.connect(), 3000);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const type = message.type;
          
          if (this.messageHandlers.has(type)) {
            this.messageHandlers.get(type).forEach(handler => handler(message));
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      // Attempt to reconnect after 3 seconds
      setTimeout(() => this.connect(), 3000);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }

  on(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
  }

  off(type, handler) {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  onConnect(handler) {
    this.connectionHandlers.onConnect.push(handler);
  }

  onDisconnect(handler) {
    this.connectionHandlers.onDisconnect.push(handler);
  }

  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('Cannot send message, socket not connected');
    }
  }
}

// Create a singleton instance
const socketClient = new SocketClient('ws://localhost:8081');

export default socketClient; 