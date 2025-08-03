# 🚀 Collaborative Code Editor

A real-time collaborative code editor with multi-user support, syntax highlighting, live editing, integrated chat, and AI assistance. Built with React, TypeScript, Node.js, and Socket.io.

![Collaborative Code Editor](https://img.shields.io/badge/Status-Ready%20to%20Use-brightgreen)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue)
![Node.js](https://img.shields.io/badge/Node.js-Latest-green)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7.4-black)

## ✨ Features

### 🎯 Core Features
- **Real-time Collaborative Editing**: Multiple users can edit code simultaneously with operational transformation
- **Syntax Highlighting**: Support for 15+ programming languages using Monaco Editor
- **Live Cursor Tracking**: See where other users are typing in real-time
- **Room-based Sessions**: Create or join separate coding rooms
- **User Presence Indicators**: Visual indicators showing active users
- **Auto-save**: Changes are automatically synchronized across all users

### 💬 Communication
- **Integrated Chat System**: Real-time messaging within each room
- **User Management**: See who's online with join/leave notifications
- **Typing Indicators**: Know when others are active

### 🤖 AI Assistance
- **Built-in Copilot Support**: AI code suggestions and assistance
- **Context-aware Suggestions**: AI understands your code context
- **Keyboard Shortcuts**: Quick access to AI features (Ctrl/Cmd + Space)

### 🎨 User Experience
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Dark Theme**: Professional dark theme for comfortable coding
- **Customizable Layout**: Toggle chat and user panels
- **Mobile Responsive**: Works on all devices

### 🔧 Developer Features
- **Multiple Language Support**: JavaScript, TypeScript, Python, Java, C++, C#, HTML, CSS, JSON, Markdown, SQL, PHP, Go, Rust, YAML
- **Code Download**: Export your collaborative code
- **Copy to Clipboard**: Quick code sharing
- **Language Switching**: Real-time language changes for all users

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collaborative-code-editor
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend development server on `http://localhost:3000`

4. **Open your browser**
   Navigate to `http://localhost:3000` and start collaborating!

## 📱 How to Use

### Creating a Room
1. Enter your display name
2. Choose "Create Room" tab
3. Enter a room name
4. Click "Create Room"

### Joining an Existing Room
1. Enter your display name
2. Choose "Existing Rooms" tab to see active rooms
3. Click "Join" on any available room
4. Or use "Quick Join" tab to join with a specific room ID

### Collaborative Editing
- Start typing - your changes appear in real-time for all users
- See other users' cursors and selections
- Use the language dropdown to change syntax highlighting
- Click "AI Assist" or press Ctrl/Cmd + Space for code suggestions

### Using Chat
- Click the chat icon to open/close the chat panel
- Type messages to communicate with your team
- Messages are persistent within each room session

### Managing the Interface
- Toggle the user list with the users icon
- Minimize or close the chat panel
- Use the "Leave" button to exit the current room

## 🏗️ Project Structure

```
collaborative-code-editor/
├── server/                 # Backend Node.js server
│   └── index.js           # Main server file with Socket.io
├── client/                # Frontend React application
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── CodeEditor.tsx    # Monaco editor with collaboration
│   │   │   ├── Chat.tsx          # Real-time chat component
│   │   │   ├── UserList.tsx      # Active users display
│   │   │   └── RoomSelector.tsx  # Room management
│   │   ├── services/     # API and Socket.io services
│   │   │   └── socket.ts # Socket.io client service
│   │   ├── types/        # TypeScript type definitions
│   │   │   └── index.ts  # Shared types and interfaces
│   │   ├── App.tsx       # Main application component
│   │   └── index.tsx     # React entry point
├── package.json          # Root package.json for scripts
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables

**Server (.env)**
```env
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Client (client/.env)**
```env
REACT_APP_SERVER_URL=http://localhost:5000
```

### Customization

#### Adding New Languages
Edit `client/src/components/CodeEditor.tsx` and add to the `SUPPORTED_LANGUAGES` array:

```typescript
const SUPPORTED_LANGUAGES = [
  // ... existing languages
  { value: 'newlang', label: 'New Language' },
];
```

#### Styling
The application uses Tailwind CSS. Customize the theme in `client/tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          // Customize primary colors
        }
      }
    },
  },
}
```

## 📡 API Endpoints

### REST API
- `GET /api/rooms` - Get list of active rooms
- `POST /api/rooms` - Create a new room

### Socket.io Events

#### Client → Server
- `join-room` - Join a coding room
- `document-operation` - Send text changes
- `cursor-position` - Update cursor position
- `language-change` - Change programming language
- `chat-message` - Send chat message
- `ai-assistance` - Request AI code help

#### Server → Client
- `room-joined` - Room join confirmation
- `user-joined` / `user-left` - User presence updates
- `document-operation` - Receive text changes
- `cursor-position` - Other users' cursor positions
- `language-change` - Language updates
- `chat-message` - Receive chat messages
- `ai-suggestion` - AI code suggestions

## 🚀 Deployment

### Production Build

1. **Build the client**
   ```bash
   cd client
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
WORKDIR /app/client
RUN npm install && npm run build

WORKDIR /app
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Variables for Production
```env
PORT=5000
CLIENT_URL=https://yourdomain.com
NODE_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

**Connection Issues**
- Ensure both server and client are running
- Check that ports 3000 and 5000 are available
- Verify firewall settings

**Monaco Editor Not Loading**
- Clear browser cache
- Check console for JavaScript errors
- Ensure all dependencies are installed

**Socket.io Connection Fails**
- Verify server is running on correct port
- Check CORS configuration
- Ensure WebSocket support in your environment

### Getting Help

If you encounter issues:

1. Check the browser console for errors
2. Verify all dependencies are installed correctly
3. Ensure you're using Node.js v16 or higher
4. Check that no other applications are using ports 3000 or 5000

## 🚀 Roadmap

Future enhancements planned:

- [ ] File tree and multi-file support
- [ ] Version history and branching
- [ ] Enhanced AI features (code generation, refactoring)
- [ ] Video/voice chat integration
- [ ] Plugin system for extensions
- [ ] Advanced permission management
- [ ] Code execution environment
- [ ] Integration with Git repositories

---

**Happy Coding! 🎉**

Built with ❤️ for collaborative development teams.
