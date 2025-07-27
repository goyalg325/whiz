import React, { useState, useEffect, useRef } from 'react';

function ChatArea({ 
  room, 
  messages, 
  onSendMessage, 
  onMessageSelect, 
  onReplyToMessage, 
  replyToMessage, 
  onCancelReply,
  user 
}) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // If room is null, show a placeholder
  if (!room) {
    return (
      <div className="flex flex-col flex-1 bg-gray-700 justify-center items-center">
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-6 text-gray-500">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <p className="text-gray-300 text-xl font-medium">Select a channel to start chatting</p>
          <p className="text-sm text-gray-500 mt-2">Pick a channel from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-700">
      {/* Channel Header - Fixed */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-600 bg-gray-700 flex-shrink-0">
        <div className="flex items-center">
          <div className="flex items-center">
            <span className="text-gray-400 mr-1">#</span>
            <h2 className="text-xl font-semibold text-white">{room.name}</h2>
          </div>
          <div className="ml-4 flex items-center space-x-1">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
              </svg>
            </button>
            <div className="w-px h-6 bg-gray-600"></div>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-400">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
            {messages.length} members
          </div>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages area - Scrollable */}
      <div 
        className="flex-1 overflow-y-auto px-6 py-4 bg-gray-700 min-h-0"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#4B5563 #374151'
        }}
      >
        {/* Date Divider */}
        <div className="flex items-center justify-center my-4">
          <div className="flex-1 h-px bg-gray-600"></div>
          <div className="px-4 py-1 bg-gray-800 text-gray-300 text-xs font-medium rounded-full border border-gray-600">
            Wednesday, May 7th
          </div>
          <div className="flex-1 h-px bg-gray-600"></div>
        </div>

        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 text-gray-500">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
              </svg>
            </div>
            <p className="text-gray-300 text-lg font-medium">This is the very beginning of #{room.name}</p>
            <p className="text-sm text-gray-500 mt-2">Be the first to send a message!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((message, index) => {
              const isOwnMessage = message.username === user.username;
              
              return (
                <div 
                  key={index} 
                  className="group hover:bg-gray-600 hover:bg-opacity-50 p-2 -mx-2 rounded cursor-pointer"
                  onClick={() => onMessageSelect(message)}
                >
                  <div className="flex items-start">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded mr-3 flex-shrink-0">
                      <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center text-white font-medium">
                        {message.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <span className="font-semibold text-white mr-2 text-sm">
                          {message.username || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {message.timestamp ? formatTimestamp(message.timestamp) : 'Just now'}
                        </span>
                        
                        {/* Message Actions */}
                        <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center">
                          <button 
                            className="p-1 text-gray-400 hover:text-white hover:bg-gray-600 rounded text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReplyToMessage(message);
                            }}
                            title="Reply to message"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 717 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input - Fixed at Bottom */}
      <div className="px-6 py-4 bg-gray-700 flex-shrink-0 border-t border-gray-600">
        {replyToMessage && (
          <div className="mb-3 p-3 bg-gray-600 border border-gray-500 rounded-lg flex items-start">
            <div className="flex-1 text-sm">
              <div className="flex items-center mb-1">
                <svg className="w-4 h-4 text-blue-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 717 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"/>
                </svg>
                <span className="font-semibold text-white">
                  Reply to {replyToMessage.username || 'Unknown User'}
                </span>
              </div>
              <span className="text-gray-300 text-sm line-clamp-2">{replyToMessage.content}</span>
            </div>
            <button 
              onClick={onCancelReply}
              className="text-gray-400 hover:text-white ml-2 p-1 rounded hover:bg-gray-700"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
              </svg>
            </button>
          </div>
        )}
        
        <div className="border border-gray-500 rounded-lg bg-gray-800">
          <form onSubmit={handleSendMessage} className="flex items-center p-3">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${room.name}`}
                className="w-full text-white placeholder-gray-400 resize-none focus:outline-none text-sm leading-relaxed border-none"
                rows="1"
                style={{ 
                  minHeight: '20px',
                  maxHeight: '100px',
                  backgroundColor: '#374151 !important', // Force gray-700 background with !important
                  border: 'none !important',
                  outline: 'none !important',
                  boxShadow: 'none !important'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>
            
            <div className="flex items-center ml-3 space-x-2">
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatArea;
