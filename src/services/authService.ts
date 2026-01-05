import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import type { User } from '../types';
import { formatFirebaseError } from '../utils/errorUtils';

export const authService = {
  // Sign in
  async signIn(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      throw new Error(formatFirebaseError(error));
    }
  },

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(formatFirebaseError(error));
    }
  },

  // Create user
  async createUser(email: string, password: string, userData: Partial<User>) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      const userProfile: User = {
        id: result.user.uid,
        email,
        role: userData.role || 'staff',
        hotelId: userData.hotelId || '',
        staffId: userData.staffId,
        permissions: userData.permissions || [],
        isActive: true,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      return result.user;
    } catch (error: any) {
      throw new Error(formatFirebaseError(error));
    }
  },

  // Get user profile
  async getUserProfile(uid: string): Promise<User | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (error: any) {
      throw new Error(formatFirebaseError(error));
    }
  },

  // Password reset
  async sendPasswordResetEmail(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(formatFirebaseError(error));
    }
  },

  // Email verification
  async sendEmailVerification(user: FirebaseUser) {
    try {
      await sendEmailVerification(user);
    } catch (error: any) {
      throw new Error(formatFirebaseError(error));
    }
  },

  // Update password
  async updatePassword(newPassword: string) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Không có người dùng đăng nhập');
      await updatePassword(user, newPassword);
    } catch (error: any) {
      throw new Error(formatFirebaseError(error));
    }
  },

  // Update email
  async updateEmail(newEmail: string) {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Không có người dùng đăng nhập');
      await updateEmail(user, newEmail);
    } catch (error: any) {
      throw new Error(formatFirebaseError(error));
    }
  },

  // Re-authenticate
  async reauthenticate(password: string) {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('Không có người dùng đăng nhập');
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
    } catch (error: any) {
      throw new Error(formatFirebaseError(error));
    }
  },

  // Auth state observer
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};