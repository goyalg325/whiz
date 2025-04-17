const API_BASE_URL = 'http://localhost:8080/api';

// Generic fetch function with error handling
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Channel API endpoints
export async function fetchChannels() {
  return fetchAPI('/channels');
}

export async function fetchChannelById(channelId) {
  return fetchAPI(`/channels/${channelId}`);
}

export async function createChannel(channelData) {
  return fetchAPI('/channels', {
    method: 'POST',
    body: JSON.stringify(channelData),
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

export async function fetchMissedMessagesSummary(userId, channelId) {
  return fetchAPI(`/summaries/missed/${userId}/${channelId}`);
}

// WebSocket connection for real-time updates
export function connectWebSocket(onMessage) {
  const ws = new WebSocket('ws://localhost:8081');
  
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