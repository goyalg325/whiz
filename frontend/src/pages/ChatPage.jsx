import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import ChatArea from '../components/ChatArea.jsx';
import ContextPanel from '../components/ContextPanel';
import SummaryPanel from '../components/SummaryPanel';
import SocketClient from '../utils/socket';
import { fetchRoomMessages, updateUserActivity } from '../api/client';

function ChatPage({ 
  user, 
  rooms, 
  activeRoom, 
  onRoomSelect, 
  onLogout,
  onRoomCreated 
}) {
  const [messages, setMessages] = useState([]);
  const [showContext, setShowContext] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryType, setSummaryType] = useState('missed');
  const [socketClient, setSocketClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);

  // Initialize socket connection when room changes
  useEffect(() => {
    if (!activeRoom || !user) {
      console.log("Missing activeRoom or user, not connecting socket");
      return;
    }
    
    // Ensure we have a valid room ID
    if (!activeRoom.id || !activeRoom.name) {
      console.error("Room ID or name is missing:", activeRoom);
      return;
    }
    
    // Clean up previous connection
    if (socketClient) {
      socketClient.disconnect();
    }

    console.log("=== DEBUG ROOM INFO ===");
    console.log("Active Room:", JSON.stringify(activeRoom));
    console.log("activeRoom.id:", activeRoom.id, "Type:", typeof activeRoom.id);
    console.log("activeRoom.name:", activeRoom.name, "Type:", typeof activeRoom.name);
    console.log("Using room name for WebSocket:", activeRoom.name);
    console.log("========================");
    
    // Use room name for WebSocket connection and localStorage keys (not database ID)
    const roomName = activeRoom.name;
    
    // Clear any potentially stale localStorage data for this room
    const clearRoomStorage = () => {
      const storageKey = `messages_${roomName}`;
      console.log(`🧹 Clearing localStorage for room "${roomName}" with key: "${storageKey}"`);
      localStorage.removeItem(storageKey);
    };
    
    const loadMessageHistory = () => {
      try {
        const storageKey = `messages_${roomName}`;
        console.log(`📦 Loading from localStorage with key: "${storageKey}"`);
        const savedMessages = localStorage.getItem(storageKey);
        
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          console.log(`✅ Loaded ${parsedMessages.length} messages from localStorage for room "${roomName}"`);
          console.log(`First few messages:`, parsedMessages.slice(0, 3));
          setMessages(parsedMessages);
        } else {
          console.log(`📦 No saved messages found in localStorage for key "${storageKey}"`);
          setMessages([]);
        }
      } catch (error) {
        console.error(`❌ Error loading messages from localStorage for room "${roomName}":`, error);
        setMessages([]);
      }
    };
    
    // Load messages from API only - no localStorage fallback for empty channels
    const loadMessages = async () => {
      // Clear any old cached data first to ensure clean state
      clearRoomStorage();
      
      try {
        console.log(`=== LOADING MESSAGES FOR ROOM: ${roomName} ===`);
        console.log(`Making API call to fetchRoomMessages("${roomName}")`);
        const history = await fetchRoomMessages(roomName);
        console.log(`API Response:`, history);
        console.log(`Is array:`, Array.isArray(history), `Length:`, history?.length);
        
        if (Array.isArray(history)) {
          console.log(`✅ Loaded ${history.length} messages from API for room "${roomName}"`);
          setMessages(history);
          
          // Track user activity - mark the latest message as seen
          if (history.length > 0 && user?.username) {
            const latestMessage = history[history.length - 1];
            // Only track if it's a real database message (not optimistic update)
            if (latestMessage.id && typeof latestMessage.id === 'number') {
              try {
                await updateUserActivity(user.username, roomName, latestMessage.id);
                console.log(`📍 Marked message ${latestMessage.id} as seen for user ${user.username} in ${roomName}`);
              } catch (error) {
                console.error('Failed to update user activity:', error);
              }
            }
          }
          
          // Only save to localStorage if we have messages
          if (history.length > 0) {
            const storageKey = `messages_${roomName}`;
            localStorage.setItem(storageKey, JSON.stringify(history));
            console.log(`💾 Saved ${history.length} messages to localStorage with key: "${storageKey}"`);
          }
        } else {
          console.log(`⚠️ Invalid API response for room "${roomName}", showing empty state`);
          setMessages([]);
        }
      } catch (error) {
        console.error(`❌ Error loading message history from API for room "${roomName}", showing empty state:`, error);
        setMessages([]);
      }
    };
    
    loadMessages();
    
    // Create new connection with room name (not database ID)
    const client = new SocketClient(roomName, user.username);
    
    client.onConnect(() => {
      setIsConnected(true);
      console.log(`Connected to room: ${roomName}`);
    });
    
    client.onDisconnect(() => {
      setIsConnected(false);
      console.log(`Disconnected from room: ${roomName}`);
    });
    
    // This handler receives messages from all users via WebSocket
    client.on((message) => {
      console.log("Received message via WebSocket:", message);
      
      // Check if this is a message from another user or our own
      const isFromCurrentUser = message.username === user.username;
      if (!isFromCurrentUser) {
        console.log("Message from another user:", message.username);
      }
      
      // Add the message to our state
      setMessages(prevMessages => {
        // For the sender's own messages, replace the optimistic update with server response
        if (isFromCurrentUser) {
          // Find the optimistic message (has local- ID and same content)
          const optimisticIndex = prevMessages.findIndex(m => 
            m.id && typeof m.id === 'string' && m.id.startsWith('local-') &&
            m.content === message.content && 
            m.username === message.username
          );
          
          if (optimisticIndex !== -1) {
            console.log("Replacing optimistic message with server response");
            const updatedMessages = [...prevMessages];
            updatedMessages[optimisticIndex] = message; // Replace with server message
            
            // Save to localStorage - use room name from activeRoom
            try {
              localStorage.setItem(`messages_${activeRoom.name}`, JSON.stringify(updatedMessages));
            } catch (error) {
              console.error("Error saving messages to localStorage:", error);
            }
            
            return updatedMessages;
          }
        }
        
        // Enhanced duplicate detection for other cases
        const isDuplicate = prevMessages.some(m => {
          // Check for exact ID match if both have IDs
          if (m.id && message.id && m.id === message.id) {
            return true;
          }
          
          // Check for content-based duplicates with time tolerance
          const timeDiff = Math.abs(new Date(m.timestamp) - new Date(message.timestamp));
          return m.content === message.content && 
                 m.username === message.username && 
                 timeDiff < 5000; // 5 seconds tolerance
        });
        
        if (isDuplicate) {
          console.log("Duplicate message detected, not adding to state");
          return prevMessages;
        }
        
        const updatedMessages = [...prevMessages, message];
        
        // Track user activity for new messages (mark as seen)
        if (message.id && typeof message.id === 'number' && user?.username && activeRoom?.name) {
          // Only track if it's not the current user's own message
          if (message.username !== user.username) {
            updateUserActivity(user.username, activeRoom.name, message.id).catch(error => {
              console.error('Failed to update user activity for new message:', error);
            });
          }
        }
        
        // Save to localStorage for persistence
        try {
          localStorage.setItem(`messages_${activeRoom.name}`, JSON.stringify(updatedMessages));
        } catch (error) {
          console.error("Error saving messages to localStorage:", error);
        }
        
        return updatedMessages;
      });
    });
    
    client.connect();
    setSocketClient(client);
    
    return () => {
      client.disconnect();
    };
  }, [activeRoom, user]);

  const handleSendMessage = (content) => {
    if (socketClient && isConnected) {
      // Create a unique temporary ID for optimistic update
      const tempId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const messageData = {
        content,
        roomId: activeRoom.name, // Use room name for message routing
        username: user.username,
        parentId: replyToMessage ? replyToMessage.id : null,
        timestamp: new Date().toISOString(),
        id: tempId // Temporary ID for optimistic update
      };
      
      console.log("Sending message:", messageData);
      
      // Optimistic update - add message to UI immediately
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, messageData];
        
        // Save to localStorage for persistence (with temp ID) - use room name
        try {
          localStorage.setItem(`messages_${activeRoom.name}`, JSON.stringify(updatedMessages));
        } catch (error) {
          console.error("Error saving messages to localStorage:", error);
        }
        
        return updatedMessages;
      });
      
      // Send message via WebSocket (without the temporary ID)
      const serverMessage = {
        content: messageData.content,
        roomId: messageData.roomId, // This is now the room name
        username: messageData.username,
        parentId: messageData.parentId,
        timestamp: messageData.timestamp
        // Don't send the temporary ID to server
      };
      
      socketClient.send(serverMessage);
      
      // Clear reply state after sending
      if (replyToMessage) {
        setReplyToMessage(null);
      }
    } else {
      console.error("Cannot send message: socket not connected");
    }
  };

  const handleMessageSelect = (message) => {
    setSelectedMessage(message);
    setShowContext(true);
    setShowSummary(false);
  };

  const handleShowSummary = (type) => {
    setSummaryType(type);
    setShowSummary(true);
    setShowContext(false);
  };

  const handleCloseContext = () => {
    setShowContext(false);
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
  };

  return (
    <div className="flex h-screen bg-gray-800 text-white overflow-hidden">
      {/* Left Sidebar - Fixed Position */}
      <div className="w-64 bg-gray-900 flex flex-col flex-shrink-0">
        <Sidebar
          rooms={rooms || []}
          activeRoom={activeRoom}
          onRoomSelect={onRoomSelect}
          onShowSummary={handleShowSummary}
          username={user?.username || 'Guest'}
          onLogout={onLogout}
          onRoomCreated={onRoomCreated}
        />
      </div>

      {/* Main Chat Area - Scrollable Content */}
      <div className="flex flex-1 flex-col bg-gray-700 min-w-0">
        {activeRoom && !isConnected && (
          <div className="bg-yellow-600 text-yellow-100 text-sm p-2 text-center border-b border-gray-600 flex-shrink-0">
            Connecting to room...
          </div>
        )}
        <ChatArea
          room={activeRoom}
          messages={messages}
          onSendMessage={handleSendMessage}
          onMessageSelect={handleMessageSelect}
          onReplyToMessage={setReplyToMessage}
          replyToMessage={replyToMessage}
          onCancelReply={() => setReplyToMessage(null)}
          user={user || { username: 'Guest' }}
        />
      </div>

      {/* Right Panels (Context or Summary) - Fixed Position */}
      {showContext && (
        <div className="w-80 bg-gray-800 border-l border-gray-600 flex-shrink-0">
          <ContextPanel
            message={selectedMessage}
            onClose={handleCloseContext}
          />
        </div>
      )}

      {showSummary && (
        <div className="w-80 bg-gray-800 border-l border-gray-600 flex-shrink-0">
          <SummaryPanel
            type={summaryType}
            roomId={activeRoom?.name}
            username={user?.username}
            onClose={handleCloseSummary}
          />
        </div>
      )}
    </div>
  );
}

export default ChatPage;