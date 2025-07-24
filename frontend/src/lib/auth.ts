import { apiClient } from './api';

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isEmailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

// Auth API calls
export const authApi = {
  // Register new user
  register: async (userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    
    // Store tokens after successful registration
    if (response.success && response.data) {
      apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response;
  },

  // Login user
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    // Store tokens after successful login
    if (response.success && response.data) {
      apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response;
  },

  // Logout user
  logout: async (): Promise<ApiResponse> => {
    try {
      const response = await apiClient.post<ApiResponse>('/auth/logout');
      return response;
    } finally {
      // Always clear tokens, even if request fails
      apiClient.clearTokens();
    }
  },

  // Refresh access token
  refreshToken: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: { accessToken: string; refreshToken: string };
    }>('/auth/refresh');
    
    if (response.success && response.data) {
      apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    }
    
    throw new Error('Token refresh failed');
  },
};

// User API calls
export const userApi = {
  // Get user profile
  getProfile: async (): Promise<{ user: User }> => {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/user/profile');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to get profile');
  },

  // Update user profile
  updateProfile: async (updates: {
    name?: string;
    avatar?: string;
  }): Promise<{ user: User }> => {
    const response = await apiClient.put<ApiResponse<{ user: User }>>('/user/profile', updates);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update profile');
  },

  // Change password
  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    const response = await apiClient.put<ApiResponse>('/user/password', passwordData);
    if (!response.success) {
      throw new Error(response.message || 'Failed to change password');
    }
  },

  // Delete account
  deleteAccount: async (password: string): Promise<void> => {
    const response = await apiClient.delete<ApiResponse>('/user/account');
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete account');
    }
  },
};

interface TokenData {
  token: string;
  expiresAt: number;
}

export const authStorage = {
  // Store token with 7-day expiration
  setToken: (token: string): void => {
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    const tokenData: TokenData = { token, expiresAt };
    localStorage.setItem('auth_token', JSON.stringify(tokenData));
  },

  // Get token if not expired
  getToken: (): string | null => {
    try {
      const stored = localStorage.getItem('auth_token');
      if (!stored) return null;

      const tokenData: TokenData = JSON.parse(stored);
      
      // Check if token is expired
      if (Date.now() > tokenData.expiresAt) {
        authStorage.clearToken();
        return null;
      }

      return tokenData.token;
    } catch {
      authStorage.clearToken();
      return null;
    }
  },

  // Clear token
  clearToken: (): void => {
    localStorage.removeItem('auth_token');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return authStorage.getToken() !== null;
  }
};
