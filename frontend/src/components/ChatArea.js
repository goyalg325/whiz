import React, { useState, useEffect, useRef } from 'react';
import { fetchMessages, createMessage } from '../api/client';

function ChatArea({ channel, messages, setMessages, onMessageSelect }) {
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Load messages when channel changes
  useEffect(() => {
    if (channel) {
      const loadMessages = async () => {
        try {
          setLoading(true);
          const data = await fetchMessages(channel.id);
          setMessages(data);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error(`Failed to load messages for channel ${channel.id}:`, err);
          setError('Failed to load messages');
          setLoading(false);
        }
      };

      loadMessages();
    }
  }, [channel, setMessages]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      const messageData = {
        channel_id: channel.id,
        content: newMessage.trim(),
        parent_id: null // For top-level messages
      };
      
      await createMessage(messageData);
      
      // In a real app, we would get the created message from the response
      // and add it to the messages list. For now, we'll refetch messages.
      const updatedMessages = await fetchMessages(channel.id);
      setMessages(updatedMessages);
      
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* Channel header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold">#{channel.name}</h2>
          <p className="text-sm text-gray-500">{channel.description || 'No description'}</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error}
            <button
              className="ml-4 text-sm text-red-700 underline"
              onClick={() => fetchMessages(channel.id).then(setMessages)}
            >
              Try again
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to send a message!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className="flex hover:bg-gray-50 p-2 -mx-2 rounded-lg group"
              onClick={() => onMessageSelect(message)}
            >
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-3 flex-shrink-0">
                {message.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline">
                  <span className="font-medium mr-2">{message.username}</span>
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(message.created_at)}
                  </span>
                  <button 
                    className="ml-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 hover:text-primary-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMessageSelect(message);
                    }}
                  >
                    Get AI Context
                  </button>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="px-4 py-3 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${channel.name}`}
            className="flex-1 px-4 py-2 bg-gray-100 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-r-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatArea; 