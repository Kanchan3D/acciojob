// API Base URL for chat endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

// Chat data management with Redis
export const chatApi = {
  // Get chat messages from Redis
  async getChatMessages() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch chat messages');
      }

      return data;
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }
  },

  // Store chat messages to Redis
  async storeChatMessages(messages: any[]) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ messages }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to store chat messages');
      }

      return data;
    } catch (error) {
      console.error('Error storing chat messages:', error);
      throw error;
    }
  },

  // Get code sessions from Redis
  async getCodeSessions() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch code sessions');
      }

      return data;
    } catch (error) {
      console.error('Error fetching code sessions:', error);
      throw error;
    }
  },

  // Store code sessions to Redis
  async storeCodeSessions(sessions: any[]) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessions }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to store code sessions');
      }

      return data;
    } catch (error) {
      console.error('Error storing code sessions:', error);
      throw error;
    }
  },

  // Get active session data
  async getActiveSession() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/active-session`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch active session');
      }

      return data;
    } catch (error) {
      console.error('Error fetching active session:', error);
      throw error;
    }
  },

  // Store active session data
  async storeActiveSession(sessionData: any) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/active-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionData }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to store active session');
      }

      return data;
    } catch (error) {
      console.error('Error storing active session:', error);
      throw error;
    }
  },

  // Clear all chat data
  async clearChatData() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/clear`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to clear chat data');
      }

      return data;
    } catch (error) {
      console.error('Error clearing chat data:', error);
      throw error;
    }
  },

  // Check Redis health
  async checkHealth() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to check health');
      }

      return data;
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }
};
