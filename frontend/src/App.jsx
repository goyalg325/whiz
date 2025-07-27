import React, { useState, useEffect } from 'react';
import './App.css';
import { fetchRooms, logout } from './api/client';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ChatPage from './pages/ChatPage.jsx';

function App() {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login', 'signup', 'chat'

  useEffect(() => {
    // Check if user is already logged in (e.g., from localStorage)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setView('chat');
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('user');
      }
    }
    
    // For development testing only - auto login with test user if no stored user
    if (!storedUser) {
      const testUser = { id: 1, username: 'testuser', email: 'test@example.com' };
      setUser(testUser);
      localStorage.setItem('user', JSON.stringify(testUser));
      setView('chat');
    }
  }, []);

  // Extract loadRooms as a separate function so it can be called from callbacks
  const loadRooms = async () => {
    try {
      setLoading(true);
      let roomData = [];
      
      try {
        roomData = await fetchRooms();
        
        // Check if we got valid room data
        if (!Array.isArray(roomData) || roomData.length === 0) {
          console.log("No rooms returned from the API");
          roomData = [];
        }
        
        // Ensure room IDs are strings
        roomData = roomData.map(room => ({
          ...room,
          id: String(room.id) // Ensure ID is a string
        }));
        
        console.log("Final processed room data:", roomData);
      } catch (fetchErr) {
        console.error('Failed to fetch rooms from backend:', fetchErr);
        // Don't create any fallback rooms - let the user see the error
        roomData = [];
        console.log("No rooms loaded due to API error");
      }
      
      // Store current active room NAME to preserve it (use name instead of ID)
      const currentActiveRoomName = activeRoom?.name;
      
      setRooms(roomData);
      
      // Preserve active room if it still exists in the new room data (match by name)
      if (currentActiveRoomName) {
        const updatedActiveRoom = roomData.find(room => room.name === currentActiveRoomName);
        if (updatedActiveRoom) {
          console.log('Preserving active room:', updatedActiveRoom);
          setActiveRoom(updatedActiveRoom);
        } else {
          console.log('Previous active room no longer exists, setting first room as active');
          if (roomData.length > 0) {
            setActiveRoom(roomData[0]);
          }
        }
      } else if (roomData.length > 0) {
        // No active room, set first room as active
        console.log('No active room, setting first room as active');
        setActiveRoom(roomData[0]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to load rooms:', err);
      setError('Failed to load rooms. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    // If user is logged in, load rooms
    if (user) {
      loadRooms();
      
      // Set up periodic background sync to keep rooms updated across browsers
      // Reduced frequency to avoid disrupting user experience
      const syncInterval = setInterval(() => {
        console.log('Background sync: refreshing rooms list');
        loadRooms();
      }, 60000); // Sync every 60 seconds instead of 30
      
      return () => clearInterval(syncInterval);
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setView('chat');
  };

  const handleSignup = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setView('chat');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Failed to logout:', err);
    }
    
    // Even if the server logout fails, we'll clear the local state
    setUser(null);
    localStorage.removeItem('user');
    setView('login');
    setActiveRoom(null);
  };

  const handleRoomSelect = (room) => {
    setActiveRoom(room);
  };

  // Loading state for rooms
  if (view === 'chat' && loading && !activeRoom) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (view === 'chat' && error) {
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
  }

  // Render the appropriate view
  if (view === 'login') {
    return <LoginPage onLogin={handleLogin} onSwitchToSignup={() => setView('signup')} />;
  }

  if (view === 'signup') {
    return <SignupPage onSignup={handleSignup} onSwitchToLogin={() => setView('login')} />;
  }

  // Handle new room creation - refresh rooms list and set new room as active
  const handleRoomCreated = async (newRoom) => {
    console.log('New room created:', newRoom);
    
    // Ensure the new room has a string ID
    const processedRoom = {
      ...newRoom,
      id: String(newRoom.id)
    };
    
    // Refresh the rooms list to get the latest from server
    try {
      await loadRooms();
      
      // After loading, find and set the new room as active
      setActiveRoom(processedRoom);
      console.log('Set new room as active:', processedRoom);
    } catch (error) {
      console.error('Error refreshing rooms after creation:', error);
      // Fallback: just add to local state if server refresh fails
      setRooms(prevRooms => {
        const exists = prevRooms.some(room => room.name === processedRoom.name);
        if (!exists) {
          return [...prevRooms, processedRoom];
        }
        return prevRooms;
      });
      setActiveRoom(processedRoom);
    }
  };

  // Chat view (when user is logged in)
  return (
    <ChatPage 
      user={user}
      rooms={rooms}
      activeRoom={activeRoom}
      onRoomSelect={handleRoomSelect}
      onLogout={handleLogout}
      onRoomCreated={handleRoomCreated}
    />
  );
}

export default App;
