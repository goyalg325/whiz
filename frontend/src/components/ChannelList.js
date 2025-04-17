import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const ChannelList = () => {
  const { channels, currentChannel, switchChannel, isLoading } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');

  const handleSwitchChannel = (channelId) => {
    if (currentChannel?.id !== channelId) {
      switchChannel(channelId);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    // In a real app, we would call an API to create the channel
    // For now, we'll just close the modal
    setShowCreateModal(false);
    setNewChannelName('');
    setNewChannelDescription('');
  };

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col h-full">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Channels</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
        >
          +
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-gray-400">Loading channels...</div>
        ) : channels.length === 0 ? (
          <div className="p-4 text-gray-400">No channels available</div>
        ) : (
          <ul>
            {channels.map((channel) => (
              <li key={channel.id}>
                <button
                  onClick={() => handleSwitchChannel(channel.id)}
                  className={`w-full text-left p-3 hover:bg-gray-700 transition-colors ${
                    currentChannel?.id === channel.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="font-medium"># {channel.name}</div>
                  {channel.description && (
                    <div className="text-sm text-gray-400 truncate">{channel.description}</div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md text-gray-800">
            <h3 className="text-lg font-semibold mb-4">Create New Channel</h3>
            
            <form onSubmit={handleCreateChannel}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Channel Name</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="e.g. general"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  placeholder="What's this channel about?"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelList; 