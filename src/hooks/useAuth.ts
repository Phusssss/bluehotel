import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';

export const useAuth = () => {
  const { 
    user, 
    isAuthenticated, 
    loading, 
    error,
    login,
    logout,
    register,
    refreshUser,
    initializeAuth
  } = useAuthStore();

  useEffect(() => {
    // Initialize auth on mount
    initializeAuth();
  }, [initializeAuth]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    refreshUser,
    // Helper methods
    signIn: login,
    signOut: logout,
  };
};