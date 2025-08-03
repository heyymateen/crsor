import { io, Socket } from 'socket.io-client';
import {
  User,
  Room,
  DocumentOperation,
  ChatMessage,
  CursorPosition,
  AIAssistanceRequest,
  AIAssistanceResponse,
  RoomJoinData,
  LanguageChangeData
} from '../types';

class SocketService {
  private socket: Socket | null = null;
  private readonly serverUrl: string;

  constructor() {
    this.serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
  }

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Room management
  joinRoom(data: RoomJoinData): void {
    this.socket?.emit('join-room', data);
  }

  onRoomJoined(callback: (room: Room) => void): void {
    this.socket?.on('room-joined', callback);
  }

  onUserJoined(callback: (user: User) => void): void {
    this.socket?.on('user-joined', callback);
  }

  onUserLeft(callback: (user: User) => void): void {
    this.socket?.on('user-left', callback);
  }

  // Document operations
  sendDocumentOperation(operation: Omit<DocumentOperation, 'id' | 'timestamp'>): void {
    this.socket?.emit('document-operation', operation);
  }

  onDocumentOperation(callback: (operation: DocumentOperation) => void): void {
    this.socket?.on('document-operation', callback);
  }

  // Cursor position
  sendCursorPosition(cursor: { line: number; column: number }): void {
    this.socket?.emit('cursor-position', { cursor });
  }

  onCursorPosition(callback: (position: CursorPosition) => void): void {
    this.socket?.on('cursor-position', callback);
  }

  // Language change
  sendLanguageChange(language: string): void {
    this.socket?.emit('language-change', { language });
  }

  onLanguageChange(callback: (data: LanguageChangeData) => void): void {
    this.socket?.on('language-change', callback);
  }

  // Chat
  sendChatMessage(message: string): void {
    this.socket?.emit('chat-message', { message });
  }

  onChatMessage(callback: (message: ChatMessage) => void): void {
    this.socket?.on('chat-message', callback);
  }

  // AI assistance
  requestAIAssistance(request: AIAssistanceRequest): void {
    this.socket?.emit('ai-assistance', request);
  }

  onAISuggestion(callback: (response: AIAssistanceResponse) => void): void {
    this.socket?.on('ai-suggestion', callback);
  }

  // Utility methods
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  removeListener(event: string): void {
    this.socket?.off(event);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();