import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const ChatInput = ({ replyToMessage = null, onCancelReply = null }) => {
  const [message, setMessage] = useState('');
  const { sendMessage, isLoading } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    try {
      const parentId = replyToMessage ? replyToMessage.id : null;
      await sendMessage(message, parentId);
      setMessage('');
      
      // If replying to a message, cancel reply mode
      if (replyToMessage && onCancelReply) {
        onCancelReply();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      {replyToMessage && (
        <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-start">
          <div className="flex-1 text-xs">
            <span className="font-semibold block text-gray-800">
              Reply to {replyToMessage.username}
            </span>
            <span className="text-gray-600 line-clamp-1">{replyToMessage.content}</span>
          </div>
          <button 
            onClick={onCancelReply}
            className="text-gray-500 hover:text-gray-700 ml-2 p-1"
          >
            ✕
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-l-lg py-2 px-4 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white placeholder-gray-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-2 px-4 rounded-r-lg transition-colors duration-200 font-medium"
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatInput; 