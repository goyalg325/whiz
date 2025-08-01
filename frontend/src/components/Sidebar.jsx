import React, { useState } from 'react';
import { createRoom } from '../api/client';

function Sidebar({ 
  rooms, 
  activeRoom, 
  onRoomSelect, 
  onShowSummary, 
  username, 
  onLogout,
  onRoomCreated // New callback for when a room is created
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [error, setError] = useState(null);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) {
      setError('Room name is required');
      return;
    }

    try {
      const roomData = {
        name: newRoomName.trim(),
        description: newRoomDesc.trim()
      };
      
      const newRoom = await createRoom(roomData);
      setNewRoomName('');
      setNewRoomDesc('');
      setIsCreating(false);
      setError(null);
      console.log('Room created successfully:', newRoom);
      
      // Notify parent component to refresh rooms list
      if (onRoomCreated) {
        onRoomCreated(newRoom);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      setError('Failed to create room. Please try again.');
    }
  };

  return (
    <aside className="w-64 bg-gray-900 flex flex-col h-screen overflow-hidden">
      {/* Top Header - Workspace Info - Fixed */}
      <div className="px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg">WhizChat</h1>
            <div className="flex items-center text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              {username}
            </div>
          </div>
          <button 
            className="text-gray-400 hover:text-white p-1"
            onClick={onLogout}
            title="Logout"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Sections - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Channels Section */}
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <button className="flex items-center text-gray-300 hover:text-white text-sm">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              Channels
            </button>
            <button 
              className="text-gray-400 hover:text-white p-1"
              onClick={() => setIsCreating(true)}
              title="Add channels"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>

          {/* Channel List */}
          <div className="space-y-0.5">
            {/* Custom Rooms */}
            {rooms && rooms.length > 0 ? (
              rooms.map(room => (
                <button 
                  key={room.id}
                  className={`w-full flex items-center px-2 py-1 rounded text-sm ${
                    activeRoom && activeRoom.name === room.name 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                  onClick={() => onRoomSelect(room)}
                >
                  <span className="text-gray-500 mr-2">#</span>
                  {room.name}
                </button>
              ))
            ) : (
              <div className="text-gray-400 text-sm px-2 py-1">No channels yet</div>
            )}

            <button 
              className="w-full flex items-center px-2 py-1 text-gray-400 hover:text-gray-300 hover:bg-gray-800 rounded text-sm"
              onClick={() => setIsCreating(true)}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
              Add channels
            </button>
          </div>
        </div>

        {/* AI Tools Section - Since we have these features */}
        <div className="px-3 py-2 mt-6">
          <div className="flex items-center mb-2">
            <button className="flex items-center text-gray-300 hover:text-white text-sm">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              AI Tools
            </button>
          </div>

          <div className="space-y-0.5">
            <button 
              className="w-full flex items-center px-2 py-1 text-gray-300 hover:bg-gray-800 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => onShowSummary('missed')}
              disabled={!activeRoom}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 6.75h.007v.008H12V6.75z"/>
              </svg>
              Missed Messages
            </button>
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90%] text-gray-800">
            <h2 className="text-lg font-semibold mb-4">Create New Channel</h2>
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleCreateRoom}>
              <div className="mb-4">
                <label htmlFor="room-name" className="block text-sm font-medium mb-1.5">
                  Channel Name
                </label>
                <input
                  id="room-name"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. general"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="room-desc" className="block text-sm font-medium mb-1.5">
                  Description (optional)
                </label>
                <input
                  id="room-desc"
                  type="text"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  placeholder="What's this channel about?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
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
