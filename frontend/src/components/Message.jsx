import React, { useState } from 'react';

const Message = ({ message, user }) => {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showContext, setShowContext] = useState(false);

  // Check if this is a system message - check both isSystem field and content patterns
  const isSystemMessage = message.isSystem || 
                         message.content === "A new user has joined the room" || 
                         message.content === "user left the chat" ||
                         (typeof message.content === 'string' && (
                           message.content.includes("joined the room") ||
                           message.content.includes("left the chat")
                         ));
  
  // Debug logging to check message properties
  console.log('🔍 Message component - content:', message.content, 'isSystem:', message.isSystem, 'detected as system:', isSystemMessage);
  
  // Add alert for system messages to debug
  if (isSystemMessage) {
    console.log('🚨 SYSTEM MESSAGE DETECTED:', message.content);
  }
  
  // Compare by username since that's more reliable than user_id in our current setup
  const isOwnMessage = !isSystemMessage && message.username === user.username;
  
  const handleGetContext = async () => {
    // AI Context functionality disabled for now
    // This would need to be passed as a prop if needed
    console.log('AI Context not available in this context');
  };

  // Render system messages differently
  if (isSystemMessage) {
    return (
      <div className="mb-2 flex justify-center animate-in fade-in-0 duration-300">
        <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium border border-gray-200 shadow-sm">
          <span className="inline-flex items-center">
            <svg className="w-3 h-3 mr-1 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {typeof message.content === 'object' ? 
              JSON.stringify(message.content) : 
              message.content}
          </span>
          <span className="ml-2 text-gray-400">
            {new Date(message.created_at || message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    );
  }

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
          
          {/* Only show AI button for regular messages, not system messages */}
          {!isSystemMessage && (
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
          )}
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