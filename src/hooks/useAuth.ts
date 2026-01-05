import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';

export const useAuth = () => {
  const { user, userProfile, loading, setUser, setUserProfile, setLoading, setError } = useAuthStore();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      console.log('Auth changed:', firebaseUser?.email);
      
      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          // Fetch real user profile from Firestore
          const profile = await authService.getUserProfile(firebaseUser.uid);
          
          if (!profile) {
            // User exists in Auth but no profile in Firestore
            setError('Hồ sơ người dùng không tồn tại. Liên hệ quản trị viên.');
            await authService.signOut();
            setUser(null);
            setUserProfile(null);
            return;
          }
          
          if (!profile.isActive) {
            // User account is disabled
            setError('Tài khoản đã bị vô hiệu hóa. Liên hệ quản trị viên.');
            await authService.signOut();
            setUser(null);
            setUserProfile(null);
            return;
          }
          
          setUserProfile(profile);
          setError(null);
        } catch (error: any) {
          console.error('Error fetching user profile:', error);
          setError('Lỗi tải thông tin người dùng');
          await authService.signOut();
          setUser(null);
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setError(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setUserProfile, setLoading, setError]);

  return {
    user,
    userProfile,
    loading,
    isAuthenticated: !!user,
  };
};