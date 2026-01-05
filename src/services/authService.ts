import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import type { User } from '../types';

export const authService = {
  // Sign in
  async signIn(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  },

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
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
      throw new Error(error.message);
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
      throw new Error(error.message);
    }
  },

  // Auth state observer
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};