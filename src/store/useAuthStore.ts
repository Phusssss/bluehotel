import { create } from 'zustand';
import { apiClient } from '../services/api';
import type { User } from '../types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    permissions: string[];
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      // Store tokens
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      set({
        user: response.user as User,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        loading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
    }
  },

  register: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      set({
        user: response.user as User,
        isAuthenticated: true,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Registration failed',
        loading: false,
      });
      throw error;
    }
  },

  refreshUser: async () => {
    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      set({ user: response.user });
    } catch (error) {
      // If refresh fails, logout
      get().logout();
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  initializeAuth: () => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({
          user,
          isAuthenticated: true,
          loading: false,
        });
        // Refresh user data
        get().refreshUser();
      } catch (error) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        set({ loading: false });
      }
    } else {
      set({ loading: false });
    }
  },
}));