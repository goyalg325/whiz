import React, { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../api/client';
import socketClient from '../utils/socket';

// Create context
const AppContext = createContext();

// Context provider component
export const AppProvider = ({ children }) => {
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState({ id: 1, username: 'user1' }); // Mock user
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    socketClient.onConnect(() => setIsConnected(true));
    socketClient.onDisconnect(() => setIsConnected(false));

    socketClient.connect();

    return () => {
      socketClient.disconnect();
    };
  }, []);

  // Handle new message from socket
  useEffect(() => {
    const handleNewMessage = (message) => {
      if (currentChannel && message.channel_id === currentChannel.id) {
        setMessages(prev => [...prev, message.content]);
      }
    };

    socketClient.on('message', handleNewMessage);

    return () => {
      socketClient.off('message', handleNewMessage);
    };
  }, [currentChannel]);

  // Load channels
  useEffect(() => {
    const loadChannels = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getChannels();
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
        const data = await apiClient.getMessages(currentChannel.id);
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
    if (!currentChannel) return;

    try {
      setIsLoading(true);
      
      // Send via API
      const newMessage = await apiClient.sendMessage(
        currentChannel.id,
        content,
        parentId
      );
      
      // Also send via socket for real-time updates to other users
      socketClient.send({
        type: 'message',
        channel_id: currentChannel.id,
        user_id: user.id,
        content: newMessage
      });
      
      // Update local state
      setMessages(prev => [...prev, newMessage]);
      
      setError(null);
      return newMessage;
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
      const data = await apiClient.getMessageContext(messageId);
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
      const data = await apiClient.getChannelSummary(currentChannel.id);
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
      const data = await apiClient.getMissedMessagesSummary(currentChannel.id);
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