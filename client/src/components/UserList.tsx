import React from 'react';
import { Users, Crown } from 'lucide-react';
import { User } from '../types';

interface UserListProps {
  users: User[];
  currentUserId?: string;
  isConnected: boolean;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  currentUserId,
  isConnected
}) => {
  const formatJoinTime = (joinedAt: Date) => {
    const date = new Date(joinedAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just joined';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return date.toLocaleDateString();
  };

  const isCurrentUser = (userId: string) => userId === currentUserId;

  return (
    <div className="bg-white border-l border-gray-200 w-64 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Users size={20} className="text-primary-500" />
          <h3 className="font-semibold text-gray-800">
            Active Users ({users.length})
          </h3>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto">
        {users.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            No active users
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {users.map((user) => (
              <div
                key={user.id}
                className={`p-3 rounded-lg transition-colors ${
                  isCurrentUser(user.id)
                    ? 'bg-primary-50 border border-primary-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* User avatar */}
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm user-indicator"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-gray-800 truncate">
                        {user.name}
                      </span>
                      {isCurrentUser(user.id) && (
                        <Crown size={12} className="text-primary-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Joined {formatJoinTime(user.joinedAt)}</div>
                      <div>
                        Line {user.cursor.line}, Col {user.cursor.column}
                      </div>
                    </div>
                  </div>
                </div>

                {/* User status indicator */}
                <div className="mt-2 flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1">
                    <div
                      className="h-1 rounded-full"
                      style={{
                        backgroundColor: user.color,
                        width: '100%'
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {isCurrentUser(user.id) ? 'You' : 'Active'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with room info */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          {isConnected ? (
            <span className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Real-time collaboration active</span>
            </span>
          ) : (
            <span className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span>Disconnected from server</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};