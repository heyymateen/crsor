export interface User {
  id: string;
  name: string;
  color: string;
  cursor: {
    line: number;
    column: number;
  };
  joinedAt: Date;
}

export interface Room {
  id: string;
  name: string;
  userCount: number;
  users: User[];
  document: {
    content: string;
    language: string;
  };
  lastActivity: Date;
}

export interface DocumentOperation {
  id: string;
  type: 'insert' | 'delete';
  position: number;
  content: string;
  length: number;
  timestamp: number;
  userId?: string;
  userName?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  content: string;
  timestamp: Date;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  color: string;
  cursor: {
    line: number;
    column: number;
  };
}

export interface AIAssistanceRequest {
  position: {
    line: number;
    column: number;
  };
  context: string;
}

export interface AIAssistanceResponse {
  suggestion: string;
  position: {
    line: number;
    column: number;
  };
  context: string;
}

export interface RoomJoinData {
  roomId: string;
  userName: string;
}

export interface LanguageChangeData {
  language: string;
}