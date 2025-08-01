import React, { useState, useEffect } from 'react';
import { fetchMessageContext } from '../api/client';

function ContextPanel({ message, onClose }) {
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadContext = async () => {
      if (!message?.id) {
        setError('Message information not available');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const contextData = await fetchMessageContext(message.id);
        setContext(contextData.context || contextData);
      } catch (err) {
        console.error('Failed to fetch context:', err);
        setError('Failed to load context. Please try again.');
        // Fallback to placeholder
        setContext("Unable to load AI context at this time. This feature analyzes the message and provides relevant background from the conversation.");
      } finally {
        setLoading(false);
      }
    };

    loadContext();
  }, [message?.id]);

  return (
    <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">AI Context</h2>
        <button 
          className="text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-2">
            {message?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="font-medium">{message?.username || 'Unknown User'}</span>
        </div>
        <p className="text-gray-800 whitespace-pre-wrap">{message?.content || 'No content'}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-3 text-sm text-gray-600">Analyzing message context...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              Error Loading Context
            </div>
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                AI Context Analysis
              </h3>
              <span className="text-xs text-gray-400">Powered by Gemini</span>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="prose prose-sm max-w-none">
                  <div 
                    className="text-gray-800 leading-relaxed"
                    style={{ whiteSpace: 'pre-wrap' }}
                    dangerouslySetInnerHTML={{
                      __html: context
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                        .replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
                        .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h2>')
                        .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold text-gray-900 mt-4 mb-2">$1</h1>')
                        .replace(/^\* (.*$)/gm, '<li class="ml-4">$1</li>')
                        .replace(/^\d+\. (.*$)/gm, '<li class="ml-4">$1</li>')
                        .replace(/\n\n/g, '<br><br>')
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
              💡 <strong>Tip:</strong> This analysis considers the message context, conversation flow, and participant interactions to help you understand the discussion better.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContextPanel;