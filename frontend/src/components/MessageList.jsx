import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import Message from './Message.jsx';

const MessageList = ({ onReplyToMessage }) => {
  const { messages, currentChannel, getMissedMessagesSummary, isLoading, user } = useApp();
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get summary of missed messages when entering a channel
  useEffect(() => {
    const loadSummary = async () => {
      if (!currentChannel) return;
      
      try {
        setLoadingSummary(true);
        const summaryData = await getMissedMessagesSummary();
        if (summaryData) {
          setSummary(summaryData.content);
          setShowSummary(true);
        }
      } catch (error) {
        console.error("Failed to get missed messages summary:", error);
      } finally {
        setLoadingSummary(false);
      }
    };
    
    loadSummary();
  }, [currentChannel, getMissedMessagesSummary]);

  if (!currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <p className="text-gray-500 text-lg">Select a channel to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative bg-white">
      {/* Channel Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <span className="text-gray-400 mr-1">#</span>
            {currentChannel.name}
          </h2>
          {currentChannel.description && (
            <p className="text-sm text-gray-500 mt-1">{currentChannel.description}</p>
          )}
        </div>
        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          Logged in as: <span className="font-medium text-blue-600">{user.username}</span>
        </div>
      </div>

      {/* Message Area with Proper Scrolling */}
      <div 
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
        style={{ 
          height: 'calc(100vh - 200px)',
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E0 #F7FAFC'
        }}
      >
        {/* Missed Messages Summary */}
        {summary && showSummary && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 relative shadow-sm">
            <button 
              onClick={() => setShowSummary(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-white"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
              </svg>
            </button>
            <div className="flex items-center mb-2">
              <div className="w-5 h-5 mr-2 text-blue-600">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-blue-800">What you missed</h3>
            </div>
            <p className="text-sm text-blue-700 leading-relaxed pl-7">{summary}</p>
          </div>
        )}

        {loadingSummary ? (
          <div className="text-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-500">Loading summary...</p>
          </div>
        ) : isLoading ? (
          <div className="text-center p-8">
            <div className="animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
            <p className="text-gray-500 mt-4">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center p-8">
            <div className="w-20 h-20 mx-auto mb-4 text-gray-300">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No messages yet</p>
            <p className="text-gray-400 text-sm mt-2">Be the first to start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div 
                key={message.id} 
                onDoubleClick={() => onReplyToMessage(message)}
                className="cursor-pointer hover:bg-gray-100 hover:bg-opacity-50 rounded-lg p-1 transition-colors"
              >
                <Message message={message} />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList; 