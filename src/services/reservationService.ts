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
import type { Reservation, ReservationFilter } from '../types';

const COLLECTION_NAME = 'reservations';

export const reservationService = {
  // Get all reservations
  async getReservations(hotelId: string, filter?: ReservationFilter): Promise<Reservation[]> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        where('hotelId', '==', hotelId)
      );

      if (filter?.status) {
        q = query(
          collection(db, COLLECTION_NAME),
          where('hotelId', '==', hotelId),
          where('status', '==', filter.status)
        );
      }

      const querySnapshot = await getDocs(q);
      const reservations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reservation));
      
      return reservations.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting reservations:', error);
      throw error;
    }
  },

  // ✨ NEW: Check room availability
  async checkAvailability(
    hotelId: string,
    roomId: string,
    checkInDate: string,
    checkOutDate: string,
    excludeReservationId?: string
  ): Promise<{available: boolean; conflicts: Reservation[]}> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('hotelId', '==', hotelId),
        where('roomId', '==', roomId)
      );

      const querySnapshot = await getDocs(q);
      const reservations = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Reservation))
        .filter(res => res.id !== excludeReservationId && !['cancelled'].includes(res.status));

      const conflicts = reservations.filter(res => {
        return (
          (checkInDate >= res.checkInDate && checkInDate < res.checkOutDate) ||
          (checkOutDate > res.checkInDate && checkOutDate <= res.checkOutDate) ||
          (checkInDate <= res.checkInDate && checkOutDate >= res.checkOutDate)
        );
      });

      return {
        available: conflicts.length === 0,
        conflicts
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  },

  // ✨ NEW: Get available rooms
  async getAvailableRooms(
    hotelId: string,
    checkInDate: string,
    checkOutDate: string,
    numberOfGuests: number
  ): Promise<any[]> {
    try {
      // Get all rooms
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('hotelId', '==', hotelId),
        where('status', '==', 'available'),
        where('maxGuests', '>=', numberOfGuests)
      );
      
      const roomsSnapshot = await getDocs(roomsQuery);
      const rooms = roomsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Check availability for each room
      const availableRooms = [];
      for (const room of rooms) {
        const { available } = await this.checkAvailability(
          hotelId, room.id, checkInDate, checkOutDate
        );
        if (available) {
          availableRooms.push({
            room,
            availablePrice: (room as any).basePrice,
            isRecommended: (room as any).roomType === 'deluxe'
          });
        }
      }

      return availableRooms;
    } catch (error) {
      console.error('Error getting available rooms:', error);
      throw error;
    }
  },

  // ✨ NEW: Check-in process
  async checkIn(
    reservationId: string,
    checkInData: {
      actualCheckInTime: string;
      notes?: string;
      guestPreferences?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, reservationId);
      await updateDoc(docRef, {
        status: 'checked-in',
        actualCheckInTime: checkInData.actualCheckInTime,
        guestPreferences: checkInData.guestPreferences || {},
        notes: checkInData.notes,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error checking in:', error);
      throw error;
    }
  },

  // ✨ NEW: Check-out process
  async checkOut(
    reservationId: string,
    checkOutData: {
      actualCheckOutTime: string;
      notes?: string;
    }
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, reservationId);
      await updateDoc(docRef, {
        status: 'checked-out',
        actualCheckOutTime: checkOutData.actualCheckOutTime,
        notes: checkOutData.notes,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error checking out:', error);
      throw error;
    }
  },

  // Get reservations by room ID
  async getReservationsByRoom(hotelId: string, roomId: string): Promise<Reservation[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('hotelId', '==', hotelId),
        where('roomId', '==', roomId),
        orderBy('checkInDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reservation));
    } catch (error) {
      console.error('Error getting reservations by room:', error);
      throw error;
    }
  },
  async getReservationById(reservationId: string): Promise<Reservation | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, reservationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Reservation;
      }
      return null;
    } catch (error) {
      console.error('Error getting reservation:', error);
      throw error;
    }
  },

  // Create reservation
  async createReservation(reservationData: Omit<Reservation, 'id'>): Promise<string> {
    try {
      // Filter out undefined values
      const cleanData = Object.fromEntries(
        Object.entries(reservationData).filter(([_, value]) => value !== undefined)
      );
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...cleanData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  },

  // Update reservation
  async updateReservation(reservationId: string, reservationData: Partial<Reservation>): Promise<void> {
    try {
      // Filter out undefined values
      const cleanData = Object.fromEntries(
        Object.entries(reservationData).filter(([_, value]) => value !== undefined)
      );
      
      const docRef = doc(db, COLLECTION_NAME, reservationId);
      await updateDoc(docRef, {
        ...cleanData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  },

  // Delete reservation
  async deleteReservation(reservationId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, reservationId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting reservation:', error);
      throw error;
    }
  },

  // ✨ NEW: Bulk operations
  async bulkUpdateReservations(reservationIds: string[], updates: Partial<Reservation>): Promise<void> {
    try {
      // Filter out undefined values
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      const promises = reservationIds.map(id => {
        const docRef = doc(db, COLLECTION_NAME, id);
        return updateDoc(docRef, { ...cleanUpdates, updatedAt: new Date() });
      });
      await Promise.all(promises);
    } catch (error) {
      console.error('Error bulk updating reservations:', error);
      throw error;
    }
  },

  async bulkDeleteReservations(reservationIds: string[]): Promise<void> {
    try {
      const promises = reservationIds.map(id => {
        const docRef = doc(db, COLLECTION_NAME, id);
        return deleteDoc(docRef);
      });
      await Promise.all(promises);
    } catch (error) {
      console.error('Error bulk deleting reservations:', error);
      throw error;
    }
  },

  // ✨ NEW: Advanced filtering
  async getReservationsAdvanced(hotelId: string, filters: {
    dateRange?: { start: string; end: string };
    roomTypes?: string[];
    guestTypes?: string[];
    paymentStatus?: string[];
    sources?: string[];
    minAmount?: number;
    maxAmount?: number;
  }): Promise<Reservation[]> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        where('hotelId', '==', hotelId)
      );

      const querySnapshot = await getDocs(q);
      let reservations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reservation));

      // Client-side filtering for complex conditions
      if (filters.dateRange) {
        reservations = reservations.filter(res => 
          res.checkInDate >= filters.dateRange!.start && 
          res.checkOutDate <= filters.dateRange!.end
        );
      }

      if (filters.roomTypes?.length) {
        // Get room data to match room types
        const roomsQuery = query(collection(db, 'rooms'), where('hotelId', '==', hotelId));
        const roomsSnapshot = await getDocs(roomsQuery);
        const roomTypeMap = new Map();
        roomsSnapshot.docs.forEach(doc => {
          const roomData = doc.data();
          roomTypeMap.set(doc.id, roomData.roomType);
        });
        
        reservations = reservations.filter(res => {
          const roomType = roomTypeMap.get(res.roomId);
          return filters.roomTypes!.includes(roomType || '');
        });
      }

      if (filters.paymentStatus?.length) {
        reservations = reservations.filter(res => 
          filters.paymentStatus!.includes(res.paymentStatus || 'pending')
        );
      }

      if (filters.sources?.length) {
        reservations = reservations.filter(res => 
          filters.sources!.includes(res.source || 'direct')
        );
      }

      if (filters.minAmount !== undefined) {
        reservations = reservations.filter(res => res.totalPrice >= filters.minAmount!);
      }

      if (filters.maxAmount !== undefined) {
        reservations = reservations.filter(res => res.totalPrice <= filters.maxAmount!);
      }

      return reservations.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error getting reservations with advanced filters:', error);
      throw error;
    }
  },

  // ✨ NEW: Move reservation (for drag-drop)
  async moveReservation(reservationId: string, newRoomId: string, newDates?: {
    checkInDate: string;
    checkOutDate: string;
  }): Promise<void> {
    try {
      const updates: Partial<Reservation> = { roomId: newRoomId };
      if (newDates) {
        updates.checkInDate = newDates.checkInDate;
        updates.checkOutDate = newDates.checkOutDate;
      }
      
      // Filter out undefined values
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );
      
      const docRef = doc(db, COLLECTION_NAME, reservationId);
      await updateDoc(docRef, { ...cleanUpdates, updatedAt: new Date() });
    } catch (error) {
      console.error('Error moving reservation:', error);
      throw error;
    }
  },

  // ✨ NEW: Priority 3 - Modification history
  async modifyReservation(
    reservationId: string,
    changes: Partial<Reservation>,
    modificationReason?: string,
    modifiedBy?: string
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, reservationId);
      const currentDoc = await getDoc(docRef);
      
      if (!currentDoc.exists()) throw new Error('Reservation not found');
      
      const currentData = currentDoc.data() as Reservation;
      const modificationLog: any = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        modifiedBy: modifiedBy || 'system',
        reason: modificationReason,
        changes: {}
      };
      
      // Track changes
      Object.keys(changes).forEach(key => {
        if (currentData[key as keyof Reservation] !== changes[key as keyof Reservation]) {
          modificationLog.changes[key] = {
            from: currentData[key as keyof Reservation],
            to: changes[key as keyof Reservation]
          };
        }
      });
      
      const updatedHistory = [...(currentData.modificationHistory || []), modificationLog];
      
      await updateDoc(docRef, {
        ...changes,
        modificationHistory: updatedHistory,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error modifying reservation:', error);
      throw error;
    }
  },

  // ✨ NEW: Get modification history - COMPLETE IMPLEMENTATION
  async getModificationHistory(reservationId: string): Promise<any[]> {
    try {
      const docRef = doc(db, COLLECTION_NAME, reservationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Reservation;
        const history = data.modificationHistory || [];
        
        // Sort by timestamp descending (newest first)
        return history.sort((a, b) => {
          const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
          const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
          return timeB - timeA;
        });
      }
      return [];
    } catch (error) {
      console.error('Error getting modification history:', error);
      throw error;
    }
  },

  // ✨ NEW: Export reservations
  async exportReservations(
    hotelId: string,
    filters: any,
    format: 'csv' | 'excel' | 'pdf'
  ): Promise<Blob> {
    try {
      const reservations = await this.getReservationsAdvanced(hotelId, filters);
      
      if (format === 'csv') {
        const csvContent = this.generateCSV(reservations);
        return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      }
      
      if (format === 'excel') {
        const excelContent = this.generateExcel(reservations);
        return new Blob([excelContent], { type: 'text/csv;charset=utf-8;' });
      }
      
      if (format === 'pdf') {
        const pdfContent = this.generatePDF(reservations);
        return new Blob([pdfContent], { type: 'text/plain;charset=utf-8;' });
      }
      
      throw new Error('Unsupported format');
    } catch (error) {
      console.error('Error exporting reservations:', error);
      throw error;
    }
  },

  // Helper: Generate CSV
  generateCSV(reservations: Reservation[]): string {
    const headers = [
      'ID', 'Guest Name', 'Room Number', 'Check-in', 'Check-out', 
      'Status', 'Total Price', 'Payment Status', 'Source', 'Confirmation Code'
    ];
    
    const rows = reservations.map(res => [
      res.id,
      res.guestName || '',
      res.roomNumber || '',
      res.checkInDate,
      res.checkOutDate,
      res.status,
      res.totalPrice,
      res.paymentStatus,
      res.source,
      res.confirmationCode
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  },

  // Helper: Generate Excel
  generateExcel(reservations: Reservation[]): string {
    // Simple CSV format for now - can be enhanced with actual Excel library
    return this.generateCSV(reservations);
  },

  // Helper: Generate PDF
  generatePDF(reservations: Reservation[]): string {
    // Simple text format for now - can be enhanced with actual PDF library
    let content = 'Reservations Report\n\n';
    reservations.forEach((res, index) => {
      content += `${index + 1}. ${res.guestName || 'N/A'} - Room ${res.roomNumber || 'N/A'}\n`;
      content += `   ${res.checkInDate} to ${res.checkOutDate} - ${res.status}\n`;
      content += `   Total: ${res.totalPrice} - ${res.paymentStatus}\n\n`;
    });
    return content;
  },

  // ✨ NEW: Detect conflicts
  async detectConflicts(hotelId: string): Promise<any> {
    try {
      const reservations = await this.getReservations(hotelId);
      const conflicts: any[] = [];
      
      // Find overlapping reservations
      for (let i = 0; i < reservations.length; i++) {
        for (let j = i + 1; j < reservations.length; j++) {
          const r1 = reservations[i], r2 = reservations[j];
          if (r1.roomId === r2.roomId && 
              r1.checkInDate < r2.checkOutDate && 
              r1.checkOutDate > r2.checkInDate &&
              !['cancelled'].includes(r1.status) &&
              !['cancelled'].includes(r2.status)) {
            conflicts.push({ 
              roomId: r1.roomId, 
              date: r1.checkInDate,
              reservations: [r1, r2] 
            });
          }
        }
      }
      
      return {
        conflicts,
        totalConflicts: conflicts.length,
        affectedRooms: [...new Set(conflicts.map(c => c.roomId))]
      };
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      throw error;
    }
  },

  // ✨ NEW: Calculate occupancy
  async calculateOccupancy(
    hotelId: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    try {
      const reservations = await this.getReservations(hotelId);
      const roomsQuery = query(collection(db, 'rooms'), where('hotelId', '==', hotelId));
      const roomsSnapshot = await getDocs(roomsQuery);
      const totalRooms = roomsSnapshot.docs.length;
      
      const dailyOccupancy = [];
      let currentDate = new Date(startDate);
      const end = new Date(endDate);
      
      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const occupiedRooms = reservations.filter(res => 
          res.checkInDate <= dateStr && 
          res.checkOutDate > dateStr &&
          !['cancelled'].includes(res.status)
        ).length;
        
        dailyOccupancy.push({
          date: dateStr,
          occupiedRooms,
          totalRooms,
          percentage: Math.round((occupiedRooms / totalRooms) * 100)
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const averageOccupancy = Math.round(
        dailyOccupancy.reduce((sum, day) => sum + day.percentage, 0) / dailyOccupancy.length
      );
      
      return {
        dateRange: { start: startDate, end: endDate },
        dailyOccupancy,
        averageOccupancy
      };
    } catch (error) {
      console.error('Error calculating occupancy:', error);
      throw error;
    }
  }
};