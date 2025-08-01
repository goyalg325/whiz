const API_BASE_URL = 'http://localhost:8080';

// Generic fetch function with error handling
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Debug request body if it exists
  if (options.body) {
    console.log(`API Request to ${endpoint}:`, options.body);
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include' // Important for cookies/sessions
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Auth endpoints
export async function signup(userData) {
  return fetchAPI('/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function login(credentials) {
  return fetchAPI('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function logout() {
  return fetchAPI('/logout', {
    method: 'GET',
  });
}

// Room API endpoints (renamed from channels)
export async function fetchRooms() {
  const rooms = await fetchAPI('/ws/getRooms');
  console.log("Fetched rooms:", rooms);
  
  // Log each room with its properties to debug
  if (Array.isArray(rooms)) {
    rooms.forEach(room => {
      console.log(`Room: id=${room.id}, name=${room.name}`);
    });
  }
  
  return rooms;
}

export async function createRoom(roomData) {
  return fetchAPI('/ws/createRoom', {
    method: 'POST',
    body: JSON.stringify(roomData),
  });
}

export async function updateChannel(channelId, channelData) {
  return fetchAPI(`/channels/${channelId}`, {
    method: 'PUT',
    body: JSON.stringify(channelData),
  });
}

export async function deleteChannel(channelId) {
  return fetchAPI(`/channels/${channelId}`, {
    method: 'DELETE',
  });
}

// Message API endpoints
export async function fetchMessages(channelId) {
  return fetchAPI(`/messages?channel_id=${channelId}`);
}

// Fetch messages for a specific room from WebSocket API
export async function fetchRoomMessages(roomId) {
  const messages = await fetchAPI(`/ws/getMessages/${roomId}`);
  console.log(`Fetched ${messages ? messages.length : 0} messages for room ${roomId}`);
  return messages || [];
}

export async function fetchMessageById(messageId) {
  return fetchAPI(`/messages/${messageId}`);
}

export async function createMessage(messageData) {
  return fetchAPI('/messages', {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
}

export async function updateMessage(messageId, content) {
  return fetchAPI(`/messages/${messageId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

export async function deleteMessage(messageId) {
  return fetchAPI(`/messages/${messageId}`, {
    method: 'DELETE',
  });
}

export async function fetchMessageContext(messageId) {
  return fetchAPI(`/messages/${messageId}/context`);
}

// Summary API endpoints
export async function fetchChannelSummary(channelId) {
  return fetchAPI(`/summaries/channel/${channelId}`);
}

export async function fetchMissedMessagesSummary(username, channelName) {
  return fetchAPI(`/summaries/missed/${username}/${channelName}`);
}

// Update user activity (mark messages as read)
export async function updateUserActivity(username, channelName, messageId) {
  return fetchAPI(`/activity/${username}/${channelName}/${messageId}`, {
    method: 'POST',
  });
}

// WebSocket connection for real-time updates
export function connectWebSocket(onMessage) {
  const ws = new WebSocket('ws://localhost:8080/ws');
  
  ws.onopen = () => {
    console.log('WebSocket connection established');
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('WebSocket connection closed');
    // Attempt to reconnect after a delay
    setTimeout(() => connectWebSocket(onMessage), 3000);
  };
  
  return ws;
} 