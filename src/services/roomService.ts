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
import type { Room, RoomFilter } from '../types';

const COLLECTION_NAME = 'rooms';

export const roomService = {
  // Get all rooms
  async getRooms(hotelId: string, filter?: RoomFilter): Promise<Room[]> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        where('hotelId', '==', hotelId),
        orderBy('roomNumber')
      );

      if (filter?.status) {
        q = query(q, where('status', '==', filter.status));
      }

      if (filter?.roomType) {
        q = query(q, where('roomType', '==', filter.roomType));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Room));
    } catch (error) {
      console.error('Error getting rooms:', error);
      throw error;
    }
  },

  // Get room by ID
  async getRoomById(roomId: string): Promise<Room | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, roomId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Room;
      }
      return null;
    } catch (error) {
      console.error('Error getting room:', error);
      throw error;
    }
  },

  // Create room
  async createRoom(roomData: Omit<Room, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...roomData,
        createdAt: new Date(),
        lastUpdated: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  },

  // Update room
  async updateRoom(roomId: string, roomData: Partial<Room>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, roomId);
      await updateDoc(docRef, {
        ...roomData,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  },

  // Delete room
  async deleteRoom(roomId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, roomId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }
};