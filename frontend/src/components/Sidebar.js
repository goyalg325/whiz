import React, { useState } from 'react';
import { createChannel } from '../api/client';

function Sidebar({ channels, activeChannel, onChannelSelect, onShowSummary }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [error, setError] = useState(null);

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) {
      setError('Channel name is required');
      return;
    }

    try {
      const channelData = {
        name: newChannelName.trim(),
        description: newChannelDesc.trim()
      };
      
      await createChannel(channelData);
      setNewChannelName('');
      setNewChannelDesc('');
      setIsCreating(false);
      setError(null);
      
      // Ideally we would update the channels list here, but for simplicity
      // we'll let the parent component handle refetching channels
      // via a useEffect that watches a dependency that we'd set here
    } catch (err) {
      setError('Failed to create channel');
      console.error(err);
    }
  };

  return (
    <aside className="w-72 flex flex-col bg-gray-900 text-gray-100">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h1 className="text-xl font-semibold text-primary-500">Whiz</h1>
        <button 
          className="p-1.5 rounded-full bg-gray-800 text-white hover:bg-gray-700 flex items-center justify-center"
          onClick={() => setIsCreating(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <div className="px-4 mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Channels</h2>
        </div>

        <ul className="space-y-1">
          {channels.map(channel => (
            <li 
              key={channel.id}
              className={`px-4 py-1.5 mx-2 rounded-md cursor-pointer flex items-center ${
                activeChannel && activeChannel.id === channel.id 
                ? 'bg-gray-700' 
                : 'hover:bg-gray-800'
              }`}
              onClick={() => onChannelSelect(channel)}
            >
              <span className="text-sm font-medium"># {channel.name}</span>
            </li>
          ))}
          {channels.length === 0 && (
            <li className="px-4 py-2 text-sm text-gray-400 italic">No channels yet</li>
          )}
        </ul>

        <div className="px-4 mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">AI Tools</h3>
          <button 
            className="w-full text-left px-3 py-2 mb-1.5 bg-gray-800 hover:bg-gray-700 text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onShowSummary('channel')}
            disabled={!activeChannel}
          >
            Channel Summary
          </button>
          <button 
            className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 text-sm rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => onShowSummary('missed')}
            disabled={!activeChannel}
          >
            Missed Messages
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90%] text-gray-800">
            <h2 className="text-lg font-semibold mb-4">Create New Channel</h2>
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateChannel}>
              <div className="mb-4">
                <label htmlFor="channel-name" className="block text-sm font-medium mb-1.5">
                  Channel Name
                </label>
                <input
                  id="channel-name"
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g. general"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="channel-desc" className="block text-sm font-medium mb-1.5">
                  Description (optional)
                </label>
                <input
                  id="channel-desc"
                  type="text"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What's this channel about?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar; 