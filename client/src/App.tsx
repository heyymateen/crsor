import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { socketService } from './services/socket';
import { CodeEditor } from './components/CodeEditor';
import { Chat } from './components/Chat';
import { UserList } from './components/UserList';
import { RoomSelector } from './components/RoomSelector';
import {
  User,
  Room,
  ChatMessage,
  CursorPosition
} from './types';
import { LogOut, MessageCircle, Users, Settings } from 'lucide-react';

function App() {
  // Application state
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userCursors, setUserCursors] = useState<CursorPosition[]>([]);
  const [documentContent, setDocumentContent] = useState('');
  const [documentLanguage, setDocumentLanguage] = useState('javascript');
  
  // UI state
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showUserList, setShowUserList] = useState(true);

  // Socket event handlers
  const setupSocketListeners = useCallback(() => {
    // Connection events
    socketService.onRoomJoined((room: Room) => {
      console.log('Joined room:', room);
      setCurrentRoom(room);
      setUsers(room.users);
      setDocumentContent(room.document.content);
      setDocumentLanguage(room.document.language);
      
      // Find current user
      const currentSocketId = socketService.getSocketId();
      const user = room.users.find(u => u.id === currentSocketId);
      if (user) {
        setCurrentUser(user);
      }
    });

    socketService.onUserJoined((user: User) => {
      console.log('User joined:', user.name);
      setUsers(prev => [...prev, user]);
    });

    socketService.onUserLeft((user: User) => {
      console.log('User left:', user.name);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      setUserCursors(prev => prev.filter(cursor => cursor.userId !== user.id));
    });

    // Chat events
    socketService.onChatMessage((message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    });

    // Cursor position events
    socketService.onCursorPosition((position: CursorPosition) => {
      setUserCursors(prev => {
        const filtered = prev.filter(cursor => cursor.userId !== position.userId);
        return [...filtered, position];
      });
    });

  }, []);

  // Initialize socket connection
  useEffect(() => {
    const socket = socketService.connect();
    
    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    setupSocketListeners();

    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, [setupSocketListeners]);

  // Handle room joining
  const handleJoinRoom = useCallback((roomId: string, userName: string) => {
    if (socketService.isConnected()) {
      socketService.joinRoom({ roomId, userName });
    } else {
      console.error('Not connected to server');
    }
  }, []);

  // Handle room creation
  const handleCreateRoom = useCallback(async (roomName: string, userName: string) => {
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: roomName }),
      });

      if (response.ok) {
        const { roomId } = await response.json();
        handleJoinRoom(roomId, userName);
      } else {
        console.error('Failed to create room');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      // Fallback to join with UUID
      handleJoinRoom(uuidv4(), userName);
    }
  }, [handleJoinRoom]);

  // Handle leaving room
  const handleLeaveRoom = useCallback(() => {
    socketService.disconnect();
    setCurrentRoom(null);
    setCurrentUser(null);
    setUsers([]);
    setChatMessages([]);
    setUserCursors([]);
    setDocumentContent('');
    setDocumentLanguage('javascript');
    setIsConnected(false);

    // Reconnect for new session
    setTimeout(() => {
      socketService.connect();
    }, 1000);
  }, []);

  // Handle content changes
  const handleContentChange = useCallback((content: string) => {
    setDocumentContent(content);
  }, []);

  // Handle language changes
  const handleLanguageChange = useCallback((language: string) => {
    setDocumentLanguage(language);
  }, []);

  // Show room selector if not in a room
  if (!currentRoom) {
    return (
      <RoomSelector
        onJoinRoom={handleJoinRoom}
        onCreateRoom={handleCreateRoom}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top navigation */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">
            Collaborative Code Editor
          </h1>
          <div className="text-sm text-gray-600">
            Room: <span className="font-medium">{currentRoom.name}</span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-lg transition-colors ${
              showChat 
                ? 'bg-primary-100 text-primary-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Toggle Chat"
          >
            <MessageCircle size={20} />
          </button>

          <button
            onClick={() => setShowUserList(!showUserList)}
            className={`p-2 rounded-lg transition-colors ${
              showUserList 
                ? 'bg-primary-100 text-primary-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Toggle User List"
          >
            <Users size={20} />
          </button>

          <div className="w-px h-6 bg-gray-300" />

          <button
            onClick={handleLeaveRoom}
            className="flex items-center space-x-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            title="Leave Room"
          >
            <LogOut size={16} />
            <span>Leave</span>
          </button>
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code editor */}
        <div className="flex-1 flex flex-col">
          <CodeEditor
            initialContent={documentContent}
            language={documentLanguage}
            onLanguageChange={handleLanguageChange}
            onContentChange={handleContentChange}
            userCursors={userCursors}
            isConnected={isConnected}
          />
        </div>

        {/* User list sidebar */}
        {showUserList && (
          <UserList
            users={users}
            currentUserId={currentUser?.id}
            isConnected={isConnected}
          />
        )}
      </div>

      {/* Chat component */}
      {showChat && (
        <Chat
          messages={chatMessages}
          isConnected={isConnected}
          isMinimized={isChatMinimized}
          onToggleMinimized={() => setIsChatMinimized(!isChatMinimized)}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Connection status overlay */}
      {!isConnected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent" />
              <span className="text-gray-900 font-medium">
                Reconnecting to server...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
