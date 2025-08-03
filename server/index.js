const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Store room data and user sessions
const rooms = new Map();
const userSessions = new Map();

// Document operations for Operational Transformation
class DocumentOperation {
  constructor(type, position, content, length = 0) {
    this.type = type; // 'insert' or 'delete'
    this.position = position;
    this.content = content;
    this.length = length;
    this.id = uuidv4();
    this.timestamp = Date.now();
  }
}

// Transform operations for concurrent editing
function transformOperation(op1, op2) {
  if (op1.position <= op2.position) {
    if (op1.type === 'insert') {
      return new DocumentOperation(
        op2.type,
        op2.position + op1.content.length,
        op2.content,
        op2.length
      );
    } else if (op1.type === 'delete') {
      return new DocumentOperation(
        op2.type,
        Math.max(op2.position - op1.length, op1.position),
        op2.content,
        op2.length
      );
    }
  }
  return op2;
}

// Room management
function createRoom(roomId, name = 'Untitled') {
  const room = {
    id: roomId,
    name: name,
    document: {
      content: '// Welcome to the collaborative code editor!\n// Start typing to begin...\n',
      language: 'javascript'
    },
    users: new Map(),
    operations: [],
    chat: [],
    createdAt: new Date(),
    lastActivity: new Date()
  };
  rooms.set(roomId, room);
  return room;
}

function getRoomInfo(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  return {
    id: room.id,
    name: room.name,
    userCount: room.users.size,
    users: Array.from(room.users.values()).map(user => ({
      id: user.id,
      name: user.name,
      color: user.color,
      cursor: user.cursor
    })),
    document: room.document,
    lastActivity: room.lastActivity
  };
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', (data) => {
    const { roomId, userName } = data;
    
    // Leave previous room if any
    if (userSessions.has(socket.id)) {
      const prevSession = userSessions.get(socket.id);
      socket.leave(prevSession.roomId);
      if (rooms.has(prevSession.roomId)) {
        rooms.get(prevSession.roomId).users.delete(socket.id);
        socket.to(prevSession.roomId).emit('user-left', prevSession.user);
      }
    }

    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      createRoom(roomId, `Room ${roomId.slice(0, 8)}`);
    }

    const room = rooms.get(roomId);
    
    // Create user object
    const user = {
      id: socket.id,
      name: userName || `User ${Math.floor(Math.random() * 1000)}`,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
      cursor: { line: 0, column: 0 },
      joinedAt: new Date()
    };

    // Add user to room
    room.users.set(socket.id, user);
    room.lastActivity = new Date();
    
    // Store user session
    userSessions.set(socket.id, { roomId, user });
    
    // Join socket room
    socket.join(roomId);
    
    // Send room info to user
    socket.emit('room-joined', getRoomInfo(roomId));
    
    // Notify other users
    socket.to(roomId).emit('user-joined', user);
    
    console.log(`User ${user.name} joined room ${roomId}`);
  });

  // Handle document operations
  socket.on('document-operation', (data) => {
    const session = userSessions.get(socket.id);
    if (!session) return;

    const { roomId } = session;
    const room = rooms.get(roomId);
    if (!room) return;

    const operation = new DocumentOperation(
      data.type,
      data.position,
      data.content,
      data.length
    );

    // Apply operation to document
    if (operation.type === 'insert') {
      const before = room.document.content.slice(0, operation.position);
      const after = room.document.content.slice(operation.position);
      room.document.content = before + operation.content + after;
    } else if (operation.type === 'delete') {
      const before = room.document.content.slice(0, operation.position);
      const after = room.document.content.slice(operation.position + operation.length);
      room.document.content = before + after;
    }

    // Store operation for operational transformation
    room.operations.push(operation);
    room.lastActivity = new Date();

    // Broadcast to other users in room
    socket.to(roomId).emit('document-operation', {
      ...operation,
      userId: socket.id,
      userName: session.user.name
    });
  });

  // Handle cursor position updates
  socket.on('cursor-position', (data) => {
    const session = userSessions.get(socket.id);
    if (!session) return;

    const { roomId, user } = session;
    const room = rooms.get(roomId);
    if (!room) return;

    // Update user cursor position
    user.cursor = data.cursor;
    room.users.set(socket.id, user);

    // Broadcast cursor position to other users
    socket.to(roomId).emit('cursor-position', {
      userId: socket.id,
      userName: user.name,
      color: user.color,
      cursor: data.cursor
    });
  });

  // Handle language change
  socket.on('language-change', (data) => {
    const session = userSessions.get(socket.id);
    if (!session) return;

    const { roomId } = session;
    const room = rooms.get(roomId);
    if (!room) return;

    room.document.language = data.language;
    room.lastActivity = new Date();

    // Broadcast language change to all users in room
    io.to(roomId).emit('language-change', { language: data.language });
  });

  // Handle chat messages
  socket.on('chat-message', (data) => {
    const session = userSessions.get(socket.id);
    if (!session) return;

    const { roomId, user } = session;
    const room = rooms.get(roomId);
    if (!room) return;

    const message = {
      id: uuidv4(),
      userId: socket.id,
      userName: user.name,
      userColor: user.color,
      content: data.message,
      timestamp: new Date()
    };

    room.chat.push(message);
    room.lastActivity = new Date();

    // Broadcast message to all users in room
    io.to(roomId).emit('chat-message', message);
  });

  // Handle AI code assistance requests
  socket.on('ai-assistance', (data) => {
    const session = userSessions.get(socket.id);
    if (!session) return;

    // For now, return a mock response
    // In a real implementation, this would call an AI service like OpenAI
    const mockSuggestions = [
      'console.log("Hello, world!");',
      'function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n-1) + fibonacci(n-2);\n}',
      '// TODO: Implement this function'
    ];

    const suggestion = mockSuggestions[Math.floor(Math.random() * mockSuggestions.length)];
    
    socket.emit('ai-suggestion', {
      suggestion: suggestion,
      position: data.position,
      context: data.context
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const session = userSessions.get(socket.id);
    if (session) {
      const { roomId, user } = session;
      const room = rooms.get(roomId);
      
      if (room) {
        room.users.delete(socket.id);
        room.lastActivity = new Date();
        
        // Notify other users
        socket.to(roomId).emit('user-left', user);
        
        // Clean up empty rooms after 1 hour
        if (room.users.size === 0) {
          setTimeout(() => {
            if (rooms.has(roomId) && rooms.get(roomId).users.size === 0) {
              rooms.delete(roomId);
              console.log(`Cleaned up empty room: ${roomId}`);
            }
          }, 3600000); // 1 hour
        }
      }
      
      userSessions.delete(socket.id);
    }
  });
});

// API endpoints
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(room => ({
    id: room.id,
    name: room.name,
    userCount: room.users.size,
    lastActivity: room.lastActivity
  }));
  res.json(roomList);
});

app.post('/api/rooms', (req, res) => {
  const roomId = uuidv4();
  const { name } = req.body;
  const room = createRoom(roomId, name || `Room ${roomId.slice(0, 8)}`);
  res.json({ roomId: room.id, name: room.name });
});

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});