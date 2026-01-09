import { apiClient } from './api';
import type { User } from '../types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
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

export const authService = {
  // Sign in
  async signIn(email: string, password: string) {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      
      // Store tokens
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return response.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Đăng nhập thất bại');
    }
  },

  // Sign out
  async signOut() {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  // Create user
  async createUser(email: string, password: string, userData: RegisterData) {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        email,
        password,
        name: userData.name,
        role: userData.role || 'staff',
      });
      
      // Store tokens
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      return response.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Đăng ký thất bại');
    }
  },

  // Get user profile
  async getUserProfile(): Promise<User | null> {
    try {
      const response = await apiClient.get<{ user: User }>('/auth/me');
      return response.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể lấy thông tin người dùng');
    }
  },

  // Password reset
  async sendPasswordResetEmail(email: string) {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể gửi email đặt lại mật khẩu');
    }
  },

  // Update password
  async updatePassword(currentPassword: string, newPassword: string) {
    try {
      await apiClient.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể cập nhật mật khẩu');
    }
  },

  // Update profile
  async updateProfile(data: Partial<User>) {
    try {
      const response = await apiClient.put<{ user: User }>('/auth/profile', data);
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(response.user));
      return response.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể cập nhật thông tin');
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  },

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        return null;
      }
    }
    return null;
  },

  // Refresh token
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await apiClient.post<{ access_token: string }>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      localStorage.setItem('access_token', response.access_token);
      return response.access_token;
    } catch (error: any) {
      // Clear tokens if refresh fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      throw error;
    }
  },
};