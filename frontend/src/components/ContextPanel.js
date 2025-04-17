import React, { useState, useEffect } from 'react';
import { fetchMessageContext } from '../api/client';

function ContextPanel({ message, onClose }) {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadContext = async () => {
      try {
        setLoading(true);
        const data = await fetchMessageContext(message.id);
        setContext(data.context);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load message context:', err);
        setError('Failed to generate context. Please try again.');
        setLoading(false);
      }
    };

    loadContext();
  }, [message.id]);

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
          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center mr-2">
            {message.username.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium">{message.username}</span>
        </div>
        <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
            <p className="mt-3 text-sm text-gray-600">Generating context...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm">
            {error}
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              AI-Generated Context
            </h3>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-800 whitespace-pre-wrap">{context}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContextPanel; 