import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';

export const useAuth = () => {
  const { user, userProfile, loading, setUser, setUserProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      console.log('Auth changed:', firebaseUser?.email);
      
      if (firebaseUser) {
        setUser(firebaseUser);
        setUserProfile({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          role: 'admin',
          hotelId: 'hotel-001',
          permissions: ['all'],
          isActive: true,
          createdAt: new Date(),
        });
      } else {
        setUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setUserProfile, setLoading]);

  return {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
  };
};