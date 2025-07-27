import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as apiClient from '../api/client';
import socketClient, { createSocketClient } from '../utils/socket';

// Create context
const AppContext = createContext();

// Context provider component
export const AppProvider = ({ children }) => {
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  // Get user ID from URL parameter for simulation
  const getUserInfo = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userIdParam = urlParams.get('user_id');
    const userId = userIdParam ? parseInt(userIdParam, 10) : 1;
    const username = `user${userId}`;
    console.log("Getting user info from URL:", { id: userId, username });
    return { id: userId, username: username };
  };
  
  const [user, setUser] = useState(getUserInfo());
  
  // Update user info when component mounts or URL changes
  useEffect(() => {
    const updateUserInfo = () => {
      const newUserInfo = getUserInfo();
      console.log("Updating user info to:", newUserInfo);
      setUser(newUserInfo);
    };
    
    // Update on mount
    updateUserInfo();
    
    // Listen for URL changes
    window.addEventListener('popstate', updateUserInfo);
    
    return () => {
      window.removeEventListener('popstate', updateUserInfo);
    };
  }, []);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Create a ref to store our socket client
  const socketClientRef = useRef(null);

  // Initialize socket connection with the correct user ID
  useEffect(() => {
    console.log("Creating socket with user ID:", user.id);
    
    // Create a new socket client with the current user ID
    socketClientRef.current = createSocketClient(user.id);
    
    // Set up connection handlers
    socketClientRef.current.onConnect(() => {
      console.log(`WebSocket connected for user ${user.id}`);
      setIsConnected(true);
    });
    
    socketClientRef.current.onDisconnect(() => {
      console.log(`WebSocket disconnected for user ${user.id}`);
      setIsConnected(false);
    });

    // Connect the socket
    socketClientRef.current.connect();

    return () => {
      if (socketClientRef.current) {
        socketClientRef.current.disconnect();
      }
    };
  }, [user.id]);

  // Handle new message from socket
  useEffect(() => {
    if (!socketClientRef.current) return;
    
    const handleNewMessage = (message) => {
      console.log("Received new message:", message);
      
      if (currentChannel && message.roomId === currentChannel.name) {
        console.log("Message is for current channel");
        
        // Create a consistent message object
        const newMessage = {
          id: `${message.username}-${message.timestamp || Date.now()}`, // More unique ID
          content: message.content,
          user_id: message.user_id || user.id,
          username: message.username,
          roomId: message.roomId,
          timestamp: message.timestamp || new Date().toISOString(),
          created_at: message.timestamp || new Date().toISOString()
        };
        
        console.log("Adding message to state:", newMessage);
        setMessages(prev => {
          // Check if the message already exists based on content, username, and timestamp
          const exists = prev.some(msg => 
            msg.content === newMessage.content && 
            msg.username === newMessage.username && 
            Math.abs(new Date(msg.timestamp || msg.created_at).getTime() - new Date(newMessage.timestamp).getTime()) < 1000
          );
          if (exists) {
            console.log("Message already exists, skipping");
            return prev;
          }
          return [...prev, newMessage];
        });
      }
    };

    // Only listen to one event type to avoid duplicates
    socketClientRef.current.on('message', handleNewMessage);

    return () => {
      if (socketClientRef.current) {
        socketClientRef.current.off('message', handleNewMessage);
      }
    };
  }, [currentChannel, user.id]);

  // Load channels
  useEffect(() => {
    const loadChannels = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.fetchChannels();
        setChannels(data);
        
        // If there are channels but no current channel, set the first one
        if (data.length > 0 && !currentChannel) {
          setCurrentChannel(data[0]);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load channels');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadChannels();
  }, [currentChannel]);

  // Load messages when channel changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!currentChannel) return;
      
      try {
        setIsLoading(true);
        const data = await apiClient.fetchMessages(currentChannel.id);
        setMessages(data);
        setError(null);
      } catch (err) {
        setError('Failed to load messages');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [currentChannel]);

  // Send a message
  const sendMessage = async (content, parentId = null) => {
    if (!currentChannel || !socketClientRef.current) return;

    try {
      setIsLoading(true);
      
      // Debug user information before sending
      console.log("Sending message with user info:", {
        user_id: user.id,
        username: user.username,
        content
      });
      
      // Only send via socket - let the backend handle database save and broadcast
      const socketMessage = {
        content: content,  // Send just the content string
        username: user.username,
        roomId: currentChannel.name,
        timestamp: new Date().toISOString()
      };
      
      console.log("Socket message:", socketMessage);
      socketClientRef.current.send(JSON.stringify(socketMessage));
      
      // Don't call API or update local state - let WebSocket handle everything
      
      setError(null);
      return { content, username: user.username, timestamp: new Date().toISOString() };
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get message context (AI-generated)
  const getMessageContext = async (messageId) => {
    try {
      setIsLoading(true);
      const data = await apiClient.fetchMessageContext(messageId);
      setError(null);
      return data;
    } catch (err) {
      setError('Failed to get message context');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get channel summary (AI-generated)
  const getChannelSummary = async () => {
    if (!currentChannel) return null;
    
    try {
      setIsLoading(true);
      const data = await apiClient.fetchChannelSummary(currentChannel.id);
      setError(null);
      return data;
    } catch (err) {
      setError('Failed to get channel summary');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get summary of missed messages
  const getMissedMessagesSummary = async () => {
    if (!currentChannel) return null;
    
    try {
      setIsLoading(true);
      const data = await apiClient.fetchMissedMessagesSummary(user.id, currentChannel.id);
      setError(null);
      return data;
    } catch (err) {
      setError('Failed to get missed messages summary');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to another channel
  const switchChannel = (channelId) => {
    const channel = channels.find(c => c.id === channelId);
    if (channel) {
      setCurrentChannel(channel);
    }
  };

  // Context value
  const value = {
    channels,
    currentChannel,
    messages,
    isConnected,
    user,
    isLoading,
    error,
    sendMessage,
    getMessageContext,
    getChannelSummary,
    getMissedMessagesSummary,
    switchChannel,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 