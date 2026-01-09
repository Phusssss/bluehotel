import axios from 'axios';
import type { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

// Types
interface ApiConfig {
  baseURL: string;
  timeout?: number;
}

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  error?: string;
}

// Create Axios instance
class ApiClient {
  private instance: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor(config: ApiConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - Add JWT token
    this.instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor - Handle 401 & token refresh
    this.instance.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Refresh token
            const newToken = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.instance(originalRequest);
          } catch (refreshError) {
            // Refresh failed - redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Refresh access token
  private async refreshAccessToken(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post<ApiResponse<{ access_token: string }>>(
        `${this.instance.defaults.baseURL}/auth/refresh`,
        { refresh_token: refreshToken }
      );

      const newToken = response.data.data.access_token;
      localStorage.setItem('access_token', newToken);
      return newToken;
    })();

    try {
      return await this.refreshTokenPromise;
    } finally {
      this.refreshTokenPromise = null;
    }
  }

  // GET request
  get<T>(url: string, config?: any): Promise<T> {
    return this.instance.get<any, T>(url, config);
  }

  // POST request
  post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.instance.post<any, T>(url, data, config);
  }

  // PUT request
  put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.instance.put<any, T>(url, data, config);
  }

  // DELETE request
  delete<T>(url: string, config?: any): Promise<T> {
    return this.instance.delete<any, T>(url, config);
  }

  // Get raw instance for advanced usage
  getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

// Export singleton instance
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const apiClient = new ApiClient({ baseURL: API_BASE_URL });