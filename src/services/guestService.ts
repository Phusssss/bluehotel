import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { Guest, GuestFilter } from '../types';

const COLLECTION_NAME = 'guests';

export const guestService = {
  // Get all guests
  async getGuests(filter?: GuestFilter): Promise<Guest[]> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );

      if (filter?.isVIP !== undefined) {
        q = query(q, where('isVIP', '==', filter.isVIP));
      }

      if (filter?.country) {
        q = query(q, where('country', '==', filter.country));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Guest));
    } catch (error) {
      console.error('Error getting guests:', error);
      throw error;
    }
  },

  // Get guest by ID
  async getGuestById(guestId: string): Promise<Guest | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, guestId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Guest;
      }
      return null;
    } catch (error) {
      console.error('Error getting guest:', error);
      throw error;
    }
  },

  // Create guest
  async createGuest(guestData: Omit<Guest, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...guestData,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating guest:', error);
      throw error;
    }
  },

  // Update guest
  async updateGuest(guestId: string, guestData: Partial<Guest>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, guestId);
      await updateDoc(docRef, guestData);
    } catch (error) {
      console.error('Error updating guest:', error);
      throw error;
    }
  },

  // Delete guest
  async deleteGuest(guestId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, guestId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting guest:', error);
      throw error;
    }
  }
};