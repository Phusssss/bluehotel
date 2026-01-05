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
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import type { Room, RoomFilter } from '../types';

const COLLECTION_NAME = 'rooms';

export const roomService = {
  // Get all rooms with pagination
  async getRooms(hotelId: string, filter?: RoomFilter & { limit?: number; startAfter?: DocumentSnapshot }): Promise<{ rooms: Room[]; lastDoc: DocumentSnapshot | null }> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        where('hotelId', '==', hotelId),
        where('isDeleted', '!=', true),
        orderBy('isDeleted'),
        orderBy('roomNumber')
      );

      if (filter?.status) {
        q = query(q, where('status', '==', filter.status));
      }

      if (filter?.roomType) {
        q = query(q, where('roomType', '==', filter.roomType));
      }

      if (filter?.limit) {
        q = query(q, limit(filter.limit));
      }

      if (filter?.startAfter) {
        q = query(q, startAfter(filter.startAfter));
      }

      const querySnapshot = await getDocs(q);
      const rooms = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Room));
      
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      return { rooms, lastDoc };
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

  // Create room with unique roomNumber check
  async createRoom(roomData: Omit<Room, 'id'>): Promise<string> {
    try {
      // Check if roomNumber already exists
      const existingRooms = await getDocs(
        query(
          collection(db, COLLECTION_NAME),
          where('hotelId', '==', roomData.hotelId),
          where('roomNumber', '==', roomData.roomNumber),
          where('isDeleted', '!=', true)
        )
      );
      
      if (!existingRooms.empty) {
        throw new Error(`Số phòng ${roomData.roomNumber} đã tồn tại`);
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...roomData,
        isDeleted: false,
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

  // Check if room has active reservations
  async hasActiveReservations(roomId: string): Promise<boolean> {
    try {
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('roomId', '==', roomId),
        where('status', 'in', ['confirmed', 'checked-in'])
      );
      
      const snapshot = await getDocs(reservationsQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking reservations:', error);
      return true; // Safe default
    }
  },

  // Delete room with safety checks
  async deleteRoom(roomId: string, force = false): Promise<void> {
    try {
      if (!force) {
        const hasReservations = await this.hasActiveReservations(roomId);
        if (hasReservations) {
          throw new Error('Không thể xóa phòng có đặt phòng đang hoạt động');
        }
      }

      // Soft delete by default
      const docRef = doc(db, COLLECTION_NAME, roomId);
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: new Date(),
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  },

  // Restore deleted room
  async restoreRoom(roomId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, roomId);
      await updateDoc(docRef, {
        isDeleted: false,
        deletedAt: null,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error restoring room:', error);
      throw error;
    }
  }
};