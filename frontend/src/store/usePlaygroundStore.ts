import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { playgroundApi, PlaygroundSession } from '@/lib/playground';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CodeSession {
  id: string;
  title: string;
  code: string;
  language: 'javascript' | 'typescript' | 'jsx' | 'tsx';
  messages?: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isServerSession?: boolean;
  _id?: string;
}

interface PlaygroundState {
  // Chat state
  messages: ChatMessage[];
  isLoading: boolean;
  
  // Code state
  currentCode: string;
  currentLanguage: 'javascript' | 'typescript' | 'jsx' | 'tsx';
  codeUpdateTrigger: number; // Force component updates
  sessions: CodeSession[];
  activeSessionId: string | null;
  
  // Server sync state
  isSyncing: boolean;
  isAuthenticated: boolean;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  updateCode: (code: string) => void;
  setLanguage: (language: 'javascript' | 'typescript' | 'jsx' | 'tsx') => void;
  createSession: (title: string) => Promise<void>;
  createLocalSession: (title: string) => void;
  loadSession: (sessionId: string) => Promise<void>;
  updateSession: (sessionId: string, updates: Partial<CodeSession>) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearMessages: () => void;
  startNewChat: () => Promise<void>;
  useLastAICode: () => void;
  
  // Server sync actions
  loadServerSessions: () => Promise<void>;
  saveMessageToServer: (message: ChatMessage) => Promise<void>;
  setAuthenticated: (authenticated: boolean) => void;
}

export const usePlaygroundStore = create<PlaygroundState>()(
  persist(
    (set, get) => {
      // Helper function to extract the last AI-generated code from messages
      const extractLastCodeFromMessages = (messages: ChatMessage[] | any[]): string | null => {
        if (!messages || messages.length === 0) return null;
        
        // Find the last assistant message that contains code
        for (let i = messages.length - 1; i >= 0; i--) {
          const message = messages[i];
          if (message.role === 'assistant') {
            // Check for code blocks
            const codeBlockRegex = /```(?:tsx?|jsx?|javascript|typescript)?\s*\n?([\s\S]*?)\n?```/g;
            const matches = message.content.match(codeBlockRegex);
            
            if (matches && matches.length > 0) {
              // Get the last code block and clean it
              const cleanCode = matches[matches.length - 1]
                .replace(/```(?:tsx?|jsx?|javascript|typescript)?\s*\n?/, '')
                .replace(/\n?```$/, '')
                .trim();
              if (cleanCode.length > 0) {
                return cleanCode;
              }
            }
            
            // If no code blocks, check if the entire response is code
            if (message.content.includes('export') || message.content.includes('function') || 
                message.content.includes('const') || message.content.includes('import')) {
              return message.content.trim();
            }
          }
        }
        return null;
      };

      return {
      // Initial state
      messages: [],
      isLoading: false,
      currentCode: `import React, { useState } from 'react';

function MyComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{ 
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f0f8ff',
      borderRadius: '8px',
      border: '2px solid #4299e1'
    }}>
      <h1 style={{ 
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#2d3748',
        marginBottom: '10px'
      }}>
        Hello World!
      </h1>
      <p style={{ 
        color: '#718096',
        marginBottom: '15px'
      }}>
        Count: {count}
      </p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          backgroundColor: '#4299e1',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Click me!
      </button>
    </div>
  );
}`,
      currentLanguage: 'jsx',
      codeUpdateTrigger: 0,
      sessions: [],
      activeSessionId: null,
      isSyncing: false,
      isAuthenticated: false,

      // Actions
      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
        };
        
        const { activeSessionId, sessions } = get();
        
        // Add message to global state for immediate UI update
        set((state) => ({
          messages: [...state.messages, newMessage],
        }));
        
        // If there's an active session, add the message to that session
        if (activeSessionId) {
          const updatedSessions = sessions.map((session) =>
            session.id === activeSessionId
              ? { 
                  ...session, 
                  messages: [...(session.messages || []), newMessage],
                  updatedAt: new Date() 
                }
              : session
          );
          set({ sessions: updatedSessions });
        }
        
        // Auto-save message to server if authenticated and has active session
        if (get().isAuthenticated && activeSessionId) {
          get().saveMessageToServer(newMessage);
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),

      updateCode: (code) => {
        console.log('updateCode called with:', code.substring(0, 100) + '...');
        set((state) => ({ 
          currentCode: code,
          codeUpdateTrigger: state.codeUpdateTrigger + 1 
        }));
        const { activeSessionId, sessions, messages, currentLanguage } = get();
        if (activeSessionId) {
          console.log('Updating session', activeSessionId, 'with new code');
          const updatedSessions = sessions.map((session) =>
            session.id === activeSessionId
              ? { 
                  ...session, 
                  code, 
                  language: currentLanguage, // Also sync the language
                  messages: messages, // Sync current messages with session
                  updatedAt: new Date() 
                }
              : session
          );
          set({ sessions: updatedSessions });
          
          // Auto-save to server if it's a server session
          const currentSession = sessions.find(s => s.id === activeSessionId);
          if (currentSession?.isServerSession && get().isAuthenticated) {
            // Debounced server update would go here
          }
        }
      },

      setLanguage: (language) => {
        set({ currentLanguage: language });
        
        // Also update the active session's language
        const { activeSessionId, sessions } = get();
        if (activeSessionId) {
          const updatedSessions = sessions.map((session) =>
            session.id === activeSessionId
              ? { 
                  ...session, 
                  language,
                  updatedAt: new Date() 
                }
              : session
          );
          set({ sessions: updatedSessions });
        }
      },

      createSession: async (title) => {
        const { isAuthenticated, currentLanguage } = get();
        console.log('Creating new session:', title);
        
        // Default code for new sessions
        const defaultCode = `import React, { useState } from 'react';

function MyComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{ 
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f0f8ff',
      borderRadius: '8px',
      border: '2px solid #4299e1'
    }}>
      <h1 style={{ 
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#2d3748',
        marginBottom: '10px'
      }}>
        Hello World!
      </h1>
      <p style={{ 
        color: '#718096',
        marginBottom: '15px'
      }}>
        Count: {count}
      </p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          backgroundColor: '#4299e1',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Click me!
      </button>
    </div>
  );
}`;
        
        console.log('Using default code for new session');
        
        if (isAuthenticated) {
          try {
            set({ isSyncing: true });
            const serverSession = await playgroundApi.createSession({
              name: title,
              code: defaultCode,
              language: currentLanguage as any, // Type assertion for server compatibility
              description: '',
              isPublic: false,
              tags: []
            });
            
            const newSession: CodeSession = {
              id: serverSession._id,
              _id: serverSession._id,
              title: serverSession.name,
              code: serverSession.code,
              language: serverSession.language as CodeSession['language'],
              messages: [], // Start with empty messages for new session
              createdAt: new Date(serverSession.createdAt),
              updatedAt: new Date(serverSession.updatedAt),
              isServerSession: true,
            };
            
            console.log('Created server session with code:', newSession.code.substring(0, 100) + '...');
            
            set((state) => ({
              sessions: [...state.sessions, newSession],
              activeSessionId: newSession.id,
              currentCode: defaultCode, // Set the default code as current code
              messages: [], // Clear global messages for new session
              isSyncing: false,
              codeUpdateTrigger: state.codeUpdateTrigger + 1,
            }));
            
          } catch (error) {
            console.error('Failed to create server session:', error);
            set({ isSyncing: false });
            // Fallback to local session
            get().createLocalSession(title);
          }
        } else {
          get().createLocalSession(title);
        }
      },

      createLocalSession: (title: string) => {
        console.log('Creating local session:', title);
        // Default code for new sessions
        const defaultCode = `import React, { useState } from 'react';

function MyComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{ 
      padding: '20px',
      textAlign: 'center',
      backgroundColor: '#f0f8ff',
      borderRadius: '8px',
      border: '2px solid #4299e1'
    }}>
      <h1 style={{ 
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#2d3748',
        marginBottom: '10px'
      }}>
        Hello World!
      </h1>
      <p style={{ 
        color: '#718096',
        marginBottom: '15px'
      }}>
        Count: {count}
      </p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          backgroundColor: '#4299e1',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Click me!
      </button>
    </div>
  );
}`;

        const newSession: CodeSession = {
          id: Math.random().toString(36).substr(2, 9),
          title,
          code: defaultCode,
          language: get().currentLanguage,
          messages: [], // Start with empty messages for new session
          createdAt: new Date(),
          updatedAt: new Date(),
          isServerSession: false,
        };
        
        console.log('Created local session with code:', newSession.code.substring(0, 100) + '...');
        
        set((state) => ({
          sessions: [...state.sessions, newSession],
          activeSessionId: newSession.id,
          currentCode: defaultCode, // Set the default code as current code
          messages: [], // Clear global messages for new session
          codeUpdateTrigger: state.codeUpdateTrigger + 1,
        }));
      },

      loadSession: async (sessionId) => {
        const session = get().sessions.find((s) => s.id === sessionId);
        if (session) {
          console.log('Loading session:', sessionId);
          
          // Get the code to use: last AI code from messages, or fallback to session.code
          const lastAICode = extractLastCodeFromMessages(session.messages || []);
          const codeToUse = lastAICode || session.code;
          
          console.log('Code source:', lastAICode ? 'Last AI message' : 'Session fallback');
          console.log('Using code:', codeToUse.substring(0, 100) + '...');
          
          set((state) => ({
            activeSessionId: sessionId,
            currentCode: codeToUse,
            currentLanguage: session.language,
            messages: session.messages || [],
            codeUpdateTrigger: state.codeUpdateTrigger + 1,
          }));
          
          // If it's a server session, fetch latest data
          if (session.isServerSession && get().isAuthenticated) {
            try {
              set({ isSyncing: true });
              const serverSession = await playgroundApi.getSession(session._id!);
              
              // Convert server messages to local format
              const serverMessages: ChatMessage[] = serverSession.messages.map((msg: any, index: number) => ({
                id: `${sessionId}-${index}`,
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.timestamp),
              }));
              
              console.log('Server session loaded, processing messages...');
              
              // Extract the latest code from server messages
              const serverLastAICode = extractLastCodeFromMessages(serverMessages);
              const finalCode = serverLastAICode || serverSession.code;
              
              console.log('Server code source:', serverLastAICode ? 'Last AI message' : 'Session fallback');
              console.log('Final code:', finalCode.substring(0, 100) + '...');
              
              set((state) => ({
                currentCode: finalCode,
                currentLanguage: serverSession.language as CodeSession['language'],
                messages: serverMessages,
                isSyncing: false,
                codeUpdateTrigger: state.codeUpdateTrigger + 1,
              }));
              
              // Update local session data
              const updatedSessions = get().sessions.map((s) =>
                s.id === sessionId
                  ? {
                      ...s,
                      code: serverSession.code, // Keep original session code for reference
                      language: serverSession.language as CodeSession['language'],
                      messages: serverMessages,
                      updatedAt: new Date(serverSession.updatedAt),
                    }
                  : s
              );
              set({ sessions: updatedSessions });
              
            } catch (error) {
              console.error('Failed to load server session:', error);
              set({ isSyncing: false });
              // Keep the local session data as fallback
            }
          }
        } else {
          console.log('Session not found:', sessionId);
        }
      },

      updateSession: async (sessionId, updates) => {
        const session = get().sessions.find(s => s.id === sessionId);
        
        // Update local state first
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? { ...session, ...updates, updatedAt: new Date() }
              : session
          ),
        }));
        
        // If it's a server session, also update on server
        if (session?.isServerSession && session._id && get().isAuthenticated) {
          try {
            console.log('Updating server session:', session._id);
            
            // Prepare update data with only the fields the server expects
            const updateData: any = {};
            if (updates.title) updateData.name = updates.title;
            if (updates.code !== undefined) updateData.code = updates.code;
            if (updates.language) updateData.language = updates.language;
            
            await playgroundApi.updateSession(session._id, updateData);
            console.log('Server session updated successfully');
          } catch (error) {
            console.error('Failed to update server session:', error);
            // Keep the local update but notify user of server sync issue
            throw error;
          }
        }
      },

      deleteSession: async (sessionId) => {
        const session = get().sessions.find(s => s.id === sessionId);
        
        if (session?.isServerSession && get().isAuthenticated) {
          try {
            set({ isSyncing: true });
            await playgroundApi.deleteSession(session._id!);
            set({ isSyncing: false });
          } catch (error) {
            console.error('Failed to delete server session:', error);
            set({ isSyncing: false });
            return;
          }
        }
        
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
          activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
        }));
      },

      clearMessages: () => set({ messages: [] }),
      
      startNewChat: async () => {
        const { activeSessionId, sessions, isAuthenticated } = get();
        
        // Clear global messages
        set({ messages: [] });
        
        // If there's an active session, clear its messages too
        if (activeSessionId) {
          const currentSession = sessions.find(s => s.id === activeSessionId);
          
          // Update local session messages
          const updatedSessions = sessions.map((session) =>
            session.id === activeSessionId
              ? { ...session, messages: [], updatedAt: new Date() }
              : session
          );
          set({ sessions: updatedSessions });
          
          // If it's a server session, also clear messages on the server
          if (currentSession?.isServerSession && currentSession._id && isAuthenticated) {
            try {
              console.log('Clearing messages on server for session:', currentSession._id);
              
              // Use the new clearSessionMessages API
              await playgroundApi.clearSessionMessages(currentSession._id);
              
              console.log('Server messages cleared successfully');
            } catch (error) {
              console.error('Failed to clear messages on server:', error);
              // Even if server update fails, keep the local state cleared
            }
          }
        }
      },

      useLastAICode: () => {
        const { messages } = get();
        console.log('useLastAICode called, checking', messages.length, 'messages');
        
        const extractedCode = extractLastCodeFromMessages(messages);
        if (extractedCode && extractedCode.length > 0) {
          console.log('Found AI code:', extractedCode.substring(0, 100) + '...');
          
          // Detect language from the code
          let detectedLanguage: 'javascript' | 'typescript' | 'jsx' | 'tsx' = 'jsx';
          if (extractedCode.includes('interface ') || extractedCode.includes('type ') || extractedCode.includes(': React.')) {
            detectedLanguage = extractedCode.includes('<') ? 'tsx' : 'typescript';
          } else if (extractedCode.includes('<') && extractedCode.includes('>')) {
            detectedLanguage = 'jsx';
          } else {
            detectedLanguage = 'javascript';
          }
          
          console.log('Detected language:', detectedLanguage);
          
          // Update the code and language using the proper updateCode flow
          set({ currentLanguage: detectedLanguage });
          get().updateCode(extractedCode); // Use the updateCode function for proper session sync
          
          return; // Exit once we find and use the code
        }
        
        console.log('No AI code found in messages');
      },
      
      // Server sync actions
      loadServerSessions: async () => {
        if (!get().isAuthenticated) return;
        
        try {
          set({ isSyncing: true });
          const response = await playgroundApi.getSessions();
          
          // Handle case where response.sessions might be undefined
          if (!response?.sessions || !Array.isArray(response.sessions)) {
            console.warn('No sessions found or invalid response structure:', response);
            set({ isSyncing: false });
            return;
          }
          
          const serverSessions: CodeSession[] = response.sessions
            .filter(session => ['javascript', 'typescript', 'jsx', 'tsx'].includes(session.language))
            .map((session) => {
              const sessionMessages = session.messages?.map((msg: any, index: number) => ({
                id: `${session._id}-${index}`,
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.timestamp),
              })) || [];
              
              // Get the effective code: last AI code from messages or fallback to session.code
              const lastAICode = extractLastCodeFromMessages(session.messages || []);
              const effectiveCode = lastAICode || session.code;
              
              console.log(`Session ${session.name}: Using ${lastAICode ? 'AI' : 'original'} code`);
              
              return {
                id: session._id,
                _id: session._id,
                title: session.name,
                code: effectiveCode, // Use the effective code (AI or original)
                language: session.language as CodeSession['language'],
                messages: sessionMessages,
                createdAt: new Date(session.createdAt),
                updatedAt: new Date(session.updatedAt),
                isServerSession: true,
              };
            });
          
          // Merge with local sessions (keep local ones that aren't on server)
          const localSessions = get().sessions.filter(s => !s.isServerSession);
          
          set({
            sessions: [...serverSessions, ...localSessions],
            isSyncing: false,
          });
          
        } catch (error) {
          console.error('Failed to load server sessions:', error);
          set({ isSyncing: false });
        }
      },
      
      saveMessageToServer: async (message: ChatMessage) => {
        const { activeSessionId, sessions, isAuthenticated } = get();
        if (!isAuthenticated || !activeSessionId) return;
        
        const session = sessions.find(s => s.id === activeSessionId);
        if (!session?.isServerSession || !session._id) return;
        
        try {
          await playgroundApi.addMessage(session._id, {
            role: message.role,
            content: message.content,
          });
        } catch (error) {
          console.error('Failed to save message to server:', error);
        }
      },
      
      setAuthenticated: (authenticated: boolean) => {
        set({ isAuthenticated: authenticated });
        // Don't automatically load server sessions here to avoid API calls during init
        // Let the AuthProvider handle this with proper timing
      },
      };
    },
    {
      name: 'playground-storage',
    }
  )
);
