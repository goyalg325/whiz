import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import Message from './Message';

const MessageList = ({ onReplyToMessage }) => {
  const { messages, currentChannel, getMissedMessagesSummary, isLoading } = useApp();
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
        <p className="text-gray-500">Select a channel to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative">
      {/* Channel Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div>
          <h2 className="text-xl font-semibold">#{currentChannel.name}</h2>
          {currentChannel.description && (
            <p className="text-sm text-gray-500">{currentChannel.description}</p>
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {/* Missed Messages Summary */}
        {summary && showSummary && (
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4 relative">
            <button 
              onClick={() => setShowSummary(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h3 className="font-semibold text-blue-800 mb-1">What you missed</h3>
            <p className="text-sm text-blue-700">{summary}</p>
          </div>
        )}

        {loadingSummary ? (
          <div className="text-center p-4 text-gray-500">Loading summary...</div>
        ) : isLoading ? (
          <div className="text-center p-4 text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center p-4 text-gray-500">No messages yet</div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} onDoubleClick={() => onReplyToMessage(message)}>
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