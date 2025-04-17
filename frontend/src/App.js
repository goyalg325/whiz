import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import ContextPanel from './components/ContextPanel';
import SummaryPanel from './components/SummaryPanel';
import { fetchChannels } from './api/client';

function App() {
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showContext, setShowContext] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryType, setSummaryType] = useState('channel'); // 'channel' or 'missed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoading(true);
        const channelData = await fetchChannels();
        setChannels(channelData);
        if (channelData.length > 0) {
          setActiveChannel(channelData[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to load channels:', err);
        setError('Failed to load channels. Please try again later.');
        setLoading(false);
      }
    };

    loadChannels();
  }, []);

  const handleChannelSelect = (channel) => {
    setActiveChannel(channel);
    setShowContext(false);
    setShowSummary(false);
  };

  const handleMessageSelect = (message) => {
    setSelectedMessage(message);
    setShowContext(true);
    setShowSummary(false);
  };

  const toggleSummary = (type) => {
    setSummaryType(type);
    setShowSummary(!showSummary);
    setShowContext(false);
  };

  if (loading) 
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );

  if (error) 
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button 
            className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        channels={channels} 
        activeChannel={activeChannel}
        onChannelSelect={handleChannelSelect}
        onShowSummary={toggleSummary}
      />
      <main className="relative flex flex-1">
        {activeChannel && (
          <ChatArea 
            channel={activeChannel} 
            messages={messages} 
            setMessages={setMessages}
            onMessageSelect={handleMessageSelect}
          />
        )}
        {showContext && selectedMessage && (
          <ContextPanel 
            message={selectedMessage}
            onClose={() => setShowContext(false)}
          />
        )}
        {showSummary && (
          <SummaryPanel 
            channel={activeChannel}
            type={summaryType}
            onClose={() => setShowSummary(false)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
