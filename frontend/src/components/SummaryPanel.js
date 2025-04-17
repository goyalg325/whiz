import React, { useState, useEffect } from 'react';
import { fetchChannelSummary, fetchMissedMessagesSummary } from '../api/client';

function SummaryPanel({ channel, type, onClose }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSummary = async () => {
      if (!channel) return;
      
      try {
        setLoading(true);
        let data;
        
        if (type === 'channel') {
          data = await fetchChannelSummary(channel.id);
        } else {
          // For demo purposes, we'll use user ID 1
          const userId = 1;
          data = await fetchMissedMessagesSummary(userId, channel.id);
        }
        
        setSummary(data.content);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load summary:', err);
        setError('Failed to generate summary. Please try again.');
        setLoading(false);
      }
    };

    loadSummary();
  }, [channel, type]);

  const getTitle = () => {
    return type === 'channel' 
      ? `Channel Summary` 
      : `Missed Messages`;
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">{getTitle()}</h2>
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
        <h3 className="font-medium mb-1">#{channel.name}</h3>
        <p className="text-sm text-gray-500">{channel.description || 'No description'}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
            <p className="mt-3 text-sm text-gray-600">Generating {type === 'channel' ? 'summary' : 'missed messages recap'}...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm">
            {error}
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
              {type === 'channel' ? 'AI-Generated Summary' : 'What You Missed'}
            </h3>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-800 whitespace-pre-wrap">{summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SummaryPanel; 