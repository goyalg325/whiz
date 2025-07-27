import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const Message = ({ message }) => {
  const { getMessageContext, user } = useApp();
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);

  // Compare by username since that's more reliable than user_id in our current setup
  const isOwnMessage = message.username === user.username;
  
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
    <div className={`mb-3 flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
      <div 
        className={`max-w-xs lg:max-w-md px-4 py-2 shadow-md transition-all duration-200 hover:shadow-lg ${
          isOwnMessage 
            ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl rounded-br-md' 
            : 'bg-white text-gray-800 border-2 border-gray-200 rounded-2xl rounded-bl-md'
        }`}
      >
        {!isOwnMessage && (
          <div className="font-semibold text-sm mb-1 text-blue-600">
            {message.username}
          </div>
        )}
        
        <div className="text-sm leading-relaxed break-words">
          {typeof message.content === 'object' ? 
            JSON.stringify(message.content) : 
            message.content}
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
            {new Date(message.created_at || message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          
          <button 
            onClick={handleGetContext}
            className={`ml-2 text-xs px-2 py-1 rounded-full transition-all duration-200 font-medium ${
              isOwnMessage 
                ? 'bg-blue-600 hover:bg-blue-800 text-white shadow-sm' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm hover:shadow-md'
            }`}
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full"></div>
            ) : (
              context && showContext ? 'Hide AI' : 'AI'
            )}
          </button>
        </div>
        
        {context && showContext && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 text-xs animate-in fade-in-0 duration-200">
            <div className="font-semibold mb-1 text-gray-700">AI Context:</div>
            <p className="leading-relaxed">{context}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message; 