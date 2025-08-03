import React, { useState, useEffect } from 'react';
import { Plus, Users, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Room {
  id: string;
  name: string;
  userCount: number;
  lastActivity: Date;
}

interface RoomSelectorProps {
  onJoinRoom: (roomId: string, userName: string) => void;
  onCreateRoom: (roomName: string, userName: string) => void;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({
  onJoinRoom,
  onCreateRoom
}) => {
  const [userName, setUserName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [customRoomId, setCustomRoomId] = useState('');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'join' | 'create' | 'existing'>('join');

  // Load existing rooms
  const loadRooms = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const rooms = await response.json();
        setAvailableRooms(rooms);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
    
    // Load saved user name
    const savedUserName = localStorage.getItem('collaborativeEditor_userName');
    if (savedUserName) {
      setUserName(savedUserName);
    }
  }, []);

  const handleJoinRoom = (roomId: string) => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }

    // Save user name
    localStorage.setItem('collaborativeEditor_userName', userName.trim());
    onJoinRoom(roomId, userName.trim());
  };

  const handleCreateRoom = () => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }

    if (!roomName.trim()) {
      alert('Please enter a room name');
      return;
    }

    // Save user name
    localStorage.setItem('collaborativeEditor_userName', userName.trim());
    onCreateRoom(roomName.trim(), userName.trim());
  };

  const handleQuickJoin = () => {
    const roomId = uuidv4();
    handleJoinRoom(roomId);
  };

  const formatLastActivity = (lastActivity: Date) => {
    const date = new Date(lastActivity);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Active now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Collaborative Code Editor
            </h1>
            <p className="text-gray-600">
              Real-time coding with your team. Choose a room to get started.
            </p>
          </div>

          {/* User name input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your display name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              maxLength={50}
            />
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('join')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'join'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Quick Join
              </button>
              <button
                onClick={() => setActiveTab('existing')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'existing'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Existing Rooms
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Create Room
              </button>
            </div>
          </div>

          {/* Tab content */}
          {activeTab === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room ID (Optional)
                </label>
                <input
                  type="text"
                  value={customRoomId}
                  onChange={(e) => setCustomRoomId(e.target.value)}
                  placeholder="Enter room ID or leave empty for random room"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => handleJoinRoom(customRoomId || uuidv4())}
                  disabled={!userName.trim()}
                  className="flex-1 bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <ArrowRight size={20} />
                  <span>Join Room</span>
                </button>
                
                <button
                  onClick={handleQuickJoin}
                  disabled={!userName.trim()}
                  className="px-6 py-3 border border-primary-500 text-primary-500 rounded-lg font-medium hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Quick Join
                </button>
              </div>
            </div>
          )}

          {activeTab === 'existing' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Available Rooms</h3>
                <button
                  onClick={loadRooms}
                  disabled={isLoading}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableRooms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No active rooms found. Create one to get started!
                  </div>
                ) : (
                  availableRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{room.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <div className="flex items-center space-x-1">
                            <Users size={14} />
                            <span>{room.userCount} users</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>{formatLastActivity(room.lastActivity)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={!userName.trim()}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Join
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter a name for your room"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>
              
              <button
                onClick={handleCreateRoom}
                disabled={!userName.trim() || !roomName.trim()}
                className="w-full bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Plus size={20} />
                <span>Create Room</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-600">
          <p>
            Features: Real-time editing • Multi-user collaboration • Integrated chat • AI assistance
          </p>
        </div>
      </div>
    </div>
  );
};