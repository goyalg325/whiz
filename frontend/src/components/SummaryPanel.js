import React, { useState, useEffect } from 'react';
import { fetchMissedMessagesSummary } from '../api/client';

function SummaryPanel({ type, roomId, username, onClose }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!username) {
        setError('Username not available');
        return;
      }

      if (type === 'missed' && !roomId) {
        setError('Channel not available');
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        if (type === 'missed') {
          // Fetch missed messages summary for the current channel only
          const data = await fetchMissedMessagesSummary(username, roomId);
          setSummaryData(data);
          setSummary(data.summary);
        }
      } catch (err) {
        console.error('Failed to fetch summary:', err);
        setError('Failed to generate summary. Please try again.');
        setSummary('');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [roomId, type, username]);

  const getTitle = () => {
    return summaryData ? `Missed Messages in #${summaryData.channelName} (${summaryData.totalCount || 0})` : 'Missed Messages';
  };

  const renderMissedMessagesContent = () => {
    if (!summaryData || summaryData.totalCount === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">All Caught Up!</h3>
          <p className="text-gray-500">No new messages in #{roomId} since your last visit.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">📊 Channel Overview</h4>
          <p className="text-blue-800 text-sm">
            <strong>{summaryData.totalCount}</strong> new messages in{' '}
            <strong>#{summaryData.channelName}</strong>
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3">🤖 AI Summary</h4>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{summary}</p>
          </div>
        </div>

        {summaryData.messages && summaryData.messages.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">� Recent Messages</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {summaryData.messages.slice(0, 5).map((message, index) => (
                <div key={index} className="text-sm border-l-2 border-gray-300 pl-3">
                  <div className="font-medium text-gray-700">{message.username}</div>
                  <div className="text-gray-600 truncate">{message.content}</div>
                </div>
              ))}
              {summaryData.messages.length > 5 && (
                <div className="text-xs text-gray-500 italic">
                  ... and {summaryData.messages.length - 5} more messages
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">{getTitle()}</h2>
        <button 
          className="text-gray-500 hover:text-gray-700 transition-colors"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-3 text-sm text-gray-600">Analyzing your missed messages...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm border border-red-200">
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Error
            </div>
            {error}
          </div>
        ) : (
          renderMissedMessagesContent()
        )}
      </div>
    </div>
  );
}

export default SummaryPanel;