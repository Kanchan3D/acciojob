'use client';

import { useState } from 'react';
import { usePlaygroundStore } from '@/store/usePlaygroundStore';
import { Save, Folder, Trash2, Plus, Calendar, Code, Cloud, HardDrive, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SessionManager() {
  const [isCreating, setIsCreating] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  
  const { 
    sessions, 
    activeSessionId, 
    createSession, 
    loadSession, 
    deleteSession,
    updateSession,
    isSyncing,
    isAuthenticated
  } = usePlaygroundStore();

  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) {
      toast.error('Please enter a session title');
      return;
    }
    
    try {
      await createSession(newSessionTitle.trim());
      setNewSessionTitle('');
      setIsCreating(false);
      toast.success('Session created!');
    } catch (error) {
      toast.error('Failed to create session');
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      await loadSession(sessionId);
      toast.success('Session loaded!');
    } catch (error) {
      toast.error('Failed to load session');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to delete this session?')) {
      try {
        await deleteSession(sessionId);
        toast.success('Session deleted!');
      } catch (error) {
        toast.error('Failed to delete session');
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-56 bg-gray-50 border-r flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-white flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 flex items-center space-x-2">
            <Folder className="w-4 h-4" />
            <span>Sessions</span>
            {isSyncing && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
          </h2>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="New Session"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Authentication Status */}
        {isAuthenticated ? (
          <div className="mb-3 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md flex items-center space-x-1">
            <Cloud className="w-3 h-3" />
            <span>Chat history synced to cloud</span>
          </div>
        ) : (
          <div className="mb-3 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md flex items-center space-x-1">
            <HardDrive className="w-3 h-3" />
            <span>Local storage only - login to sync</span>
          </div>
        )}

        {/* Create New Session */}
        {isCreating && (
          <div className="space-y-2">
            <input
              type="text"
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              placeholder="Session title..."
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateSession();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewSessionTitle('');
                }
              }}
            />
            <div className="flex space-x-1">
              <button
                onClick={handleCreateSession}
                disabled={isSyncing}
                className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSyncing ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewSessionTitle('');
                }}
                className="flex-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Save className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No saved sessions</p>
            <p className="text-xs text-gray-400 mt-1">Create your first session</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                  session.id === activeSessionId
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => handleLoadSession(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-sm text-gray-900 truncate">
                        {session.title}
                      </h3>
                      {session.isServerSession ? (
                        <span title="Synced to cloud">
                          <Cloud className="w-3 h-3 text-blue-500" />
                        </span>
                      ) : (
                        <span title="Local only">
                          <HardDrive className="w-3 h-3 text-gray-400" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Code className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500 uppercase">
                        {session.language}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {formatDate(session.updatedAt)}
                      </span>
                    </div>
                    {/* Chat history indicator */}
                    {session.messages && session.messages.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">
                          {session.messages.length} messages
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                    disabled={isSyncing}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all disabled:opacity-30"
                    title="Delete Session"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                
                {/* Code Preview */}
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono text-gray-600 overflow-hidden">
                  <div className="truncate">
                    {session.code.split('\n')[0] || 'Empty session'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="p-4 border-t bg-white flex-shrink-0">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Total Sessions:</span>
            <span className="font-medium">{sessions.length}</span>
          </div>
          {activeSessionId && (
            <div className="flex justify-between">
              <span>Active:</span>
              <span className="font-medium text-blue-600 truncate ml-1">
                {sessions.find(s => s.id === activeSessionId)?.title || 'None'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
