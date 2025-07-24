import { apiClient } from './api';

// Types
export interface PlaygroundSession {
  _id: string;
  userId: string;
  name: string;
  description: string;
  code: string;
  language: 'javascript' | 'typescript' | 'jsx' | 'tsx' | 'html' | 'css';
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  isPublic: boolean;
  tags: string[];
  lastModified: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionsResponse {
  sessions: PlaygroundSession[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalCount: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

// Playground API calls
export const playgroundApi = {
  // Get all sessions for authenticated user
  getSessions: async (options?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<SessionsResponse> => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.search) params.append('search', options.search);

    const queryString = params.toString();
    const endpoint = `/playground/sessions${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<ApiResponse<SessionsResponse>>(endpoint);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get sessions');
  },

  // Get a specific session
  getSession: async (sessionId: string): Promise<PlaygroundSession> => {
    const response = await apiClient.get<ApiResponse<{ session: PlaygroundSession }>>(
      `/playground/sessions/${sessionId}`
    );
    if (response.success && response.data) {
      return response.data.session;
    }
    throw new Error(response.message || 'Failed to get session');
  },

  // Create a new session
  createSession: async (sessionData: {
    name: string;
    description?: string;
    code?: string;
    language?: PlaygroundSession['language'];
    tags?: string[];
    isPublic?: boolean;
  }): Promise<PlaygroundSession> => {
    const response = await apiClient.post<ApiResponse<{ session: PlaygroundSession }>>(
      '/playground/sessions',
      sessionData
    );
    if (response.success && response.data) {
      return response.data.session;
    }
    throw new Error(response.message || 'Failed to create session');
  },

  // Update a session
  updateSession: async (
    sessionId: string,
    updates: {
      name?: string;
      description?: string;
      code?: string;
      language?: PlaygroundSession['language'];
      tags?: string[];
      isPublic?: boolean;
    }
  ): Promise<PlaygroundSession> => {
    const response = await apiClient.put<ApiResponse<{ session: PlaygroundSession }>>(
      `/playground/sessions/${sessionId}`,
      updates
    );
    if (response.success && response.data) {
      return response.data.session;
    }
    throw new Error(response.message || 'Failed to update session');
  },

  // Add message to session
  addMessage: async (
    sessionId: string,
    message: {
      role: 'user' | 'assistant';
      content: string;
    }
  ): Promise<PlaygroundSession> => {
    const response = await apiClient.post<ApiResponse<{ session: PlaygroundSession }>>(
      `/playground/sessions/${sessionId}/messages`,
      message
    );
    if (response.success && response.data) {
      return response.data.session;
    }
    throw new Error(response.message || 'Failed to add message');
  },

  // Delete a session
  deleteSession: async (sessionId: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse>(`/playground/sessions/${sessionId}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete session');
    }
  },

  // Get public sessions (for discovery)
  getPublicSessions: async (options?: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string;
  }): Promise<SessionsResponse> => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.search) params.append('search', options.search);
    if (options?.tags) params.append('tags', options.tags);

    const queryString = params.toString();
    const endpoint = `/playground/public${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get<ApiResponse<SessionsResponse>>(endpoint);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get public sessions');
  },
};
