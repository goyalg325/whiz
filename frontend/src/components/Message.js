import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const Message = ({ message }) => {
  const { getMessageContext, user } = useApp();
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);

  const isOwnMessage = message.user_id === user.id;
  
  const handleGetContext = async () => {
    if (context) {
      setShowContext(!showContext);
      return;
    }
    
    setLoading(true);
    try {
      const contextData = await getMessageContext(message.id);
      setContext(contextData.context);
      setShowContext(true);
    } catch (error) {
      console.error("Failed to get message context:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`mb-4 ${isOwnMessage ? 'flex justify-end' : ''}`}>
      <div className={`max-w-md rounded-lg p-3 ${
        isOwnMessage 
          ? 'bg-blue-500 text-white rounded-br-none' 
          : 'bg-gray-200 rounded-bl-none'
      }`}>
        {!isOwnMessage && (
          <div className="font-semibold text-sm mb-1">{message.username}</div>
        )}
        
        <div className="text-sm">{message.content}</div>
        
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs opacity-70">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          
          <button 
            onClick={handleGetContext}
            className={`ml-2 text-xs px-2 py-1 rounded ${
              isOwnMessage 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            disabled={loading}
          >
            {loading ? 'Loading...' : context && showContext ? 'Hide Context' : 'AI Context'}
          </button>
        </div>
        
        {context && showContext && (
          <div className="mt-2 p-2 rounded bg-gray-100 text-gray-800 text-xs">
            <div className="font-semibold mb-1">Message Context:</div>
            <p>{context}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message; 