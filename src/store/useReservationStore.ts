import { create } from 'zustand';
import type { Reservation, ReservationFilter } from '../types';
import { reservationService } from '../services/reservationService';

interface ReservationState {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  filter: ReservationFilter;
  selectedReservation: Reservation | null;
  availableRooms: any[];
  
  // ✨ Enhanced state
  operationStatus: {
    [reservationId: string]: {
      checkingIn: boolean;
      checkingOut: boolean;
      modifying: boolean;
      error?: string;
    };
  };
  
  // Actions
  setReservations: (reservations: Reservation[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: ReservationFilter) => void;
  setSelectedReservation: (reservation: Reservation | null) => void;
  setAvailableRooms: (rooms: any[]) => void;
  setOperationStatus: (reservationId: string, status: any) => void;
  
  // Async actions
  fetchReservations: (hotelId: string) => Promise<void>;
  createReservation: (reservationData: Omit<Reservation, 'id'>) => Promise<void>;
  updateReservation: (reservationId: string, reservationData: Partial<Reservation>) => Promise<void>;
  deleteReservation: (reservationId: string) => Promise<void>;
  
  // ✨ New enhanced actions
  fetchAvailableRooms: (hotelId: string, checkIn: string, checkOut: string, numberOfGuests: number) => Promise<void>;
  checkInReservation: (reservationId: string, checkInData: any) => Promise<void>;
  checkOutReservation: (reservationId: string, checkOutData: any) => Promise<void>;
  checkAvailability: (hotelId: string, roomId: string, checkIn: string, checkOut: string, excludeId?: string) => Promise<{available: boolean; conflicts: any[]}>;
  
  // ✨ NEW: Priority 2 actions
  bulkUpdate: (reservationIds: string[], updates: Partial<Reservation>) => Promise<void>;
  bulkDelete: (reservationIds: string[]) => Promise<void>;
  fetchReservationsAdvanced: (hotelId: string, filters: any) => Promise<void>;
  moveReservation: (reservationId: string, newRoomId: string, newDates?: { checkInDate: string; checkOutDate: string }) => Promise<void>;
  
  // ✨ NEW: Priority 3 actions
  modifyReservationWithHistory: (reservationId: string, changes: Partial<Reservation>, reason?: string) => Promise<void>;
  getModificationHistory: (reservationId: string) => Promise<any[]>;
  exportReservations: (format: 'csv' | 'excel' | 'pdf', filters?: any) => Promise<Blob>;
  
  // ✨ NEW: Priority 4 actions
  fetchReservationsPaginated: (hotelId: string, page?: number, pageSize?: number) => Promise<void>;
  detectConflicts: (hotelId: string) => Promise<any[]>;
  calculateOccupancy: (hotelId: string, startDate: string, endDate: string) => Promise<any>;
}

export const useReservationStore = create<ReservationState>((set, get) => ({
  reservations: [],
  loading: false,
  error: null,
  filter: {},
  selectedReservation: null,
  availableRooms: [],
  operationStatus: {},
  
  setReservations: (reservations) => set({ reservations }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilter: (filter) => set({ filter }),
  setSelectedReservation: (selectedReservation) => set({ selectedReservation }),
  setAvailableRooms: (availableRooms) => set({ availableRooms }),
  setOperationStatus: (reservationId, status) => set(state => ({
    operationStatus: {
      ...state.operationStatus,
      [reservationId]: { ...state.operationStatus[reservationId], ...status }
    }
  })),
  
  fetchReservations: async (hotelId: string) => {
    set({ loading: true, error: null });
    try {
      const reservations = await reservationService.getReservations(hotelId, get().filter);
      set({ reservations, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  createReservation: async (reservationData) => {
    set({ loading: true, error: null });
    try {
      // Add enhanced fields
      const enhancedData = {
        ...reservationData,
        source: 'online' as const,
        confirmationCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
        paymentStatus: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await reservationService.createReservation(enhancedData);
      await get().fetchReservations(reservationData.hotelId);
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  updateReservation: async (reservationId: string, reservationData) => {
    set({ loading: true, error: null });
    try {
      await reservationService.updateReservation(reservationId, reservationData);
      const { reservations } = get();
      const updatedReservations = reservations.map(reservation => 
        reservation.id === reservationId ? { ...reservation, ...reservationData } : reservation
      );
      set({ reservations: updatedReservations, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  deleteReservation: async (reservationId: string) => {
    set({ loading: true, error: null });
    try {
      await reservationService.deleteReservation(reservationId);
      const { reservations } = get();
      const filteredReservations = reservations.filter(reservation => reservation.id !== reservationId);
      set({ reservations: filteredReservations, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  // ✨ Enhanced actions
  fetchAvailableRooms: async (hotelId: string, checkIn: string, checkOut: string, numberOfGuests: number) => {
    set({ loading: true, error: null });
    try {
      const availableRooms = await reservationService.getAvailableRooms(hotelId, checkIn, checkOut, numberOfGuests);
      set({ availableRooms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  checkInReservation: async (reservationId: string, checkInData: any) => {
    get().setOperationStatus(reservationId, { checkingIn: true });
    try {
      await reservationService.checkIn(reservationId, checkInData);
      await get().fetchReservations(get().reservations[0]?.hotelId || '');
      get().setOperationStatus(reservationId, { checkingIn: false });
    } catch (error: any) {
      get().setOperationStatus(reservationId, { checkingIn: false, error: error.message });
      throw error;
    }
  },
  
  checkOutReservation: async (reservationId: string, checkOutData: any) => {
    get().setOperationStatus(reservationId, { checkingOut: true });
    try {
      await reservationService.checkOut(reservationId, checkOutData);
      await get().fetchReservations(get().reservations[0]?.hotelId || '');
      get().setOperationStatus(reservationId, { checkingOut: false });
    } catch (error: any) {
      get().setOperationStatus(reservationId, { checkingOut: false, error: error.message });
      throw error;
    }
  },
  
  checkAvailability: async (hotelId: string, roomId: string, checkIn: string, checkOut: string, excludeId?: string) => {
    try {
      return await reservationService.checkAvailability(hotelId, roomId, checkIn, checkOut, excludeId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // ✨ NEW: Bulk operations
  bulkUpdate: async (reservationIds: string[], updates: Partial<Reservation>) => {
    set({ loading: true, error: null });
    try {
      await reservationService.bulkUpdateReservations(reservationIds, updates);
      const hotelId = get().reservations[0]?.hotelId;
      if (hotelId) {
        await get().fetchReservations(hotelId);
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  bulkDelete: async (reservationIds: string[]) => {
    set({ loading: true, error: null });
    try {
      await reservationService.bulkDeleteReservations(reservationIds);
      const hotelId = get().reservations[0]?.hotelId;
      if (hotelId) {
        await get().fetchReservations(hotelId);
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // ✨ NEW: Advanced filtering
  fetchReservationsAdvanced: async (hotelId: string, filters: any) => {
    set({ loading: true, error: null });
    try {
      const reservations = await reservationService.getReservationsAdvanced(hotelId, filters);
      set({ reservations, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // ✨ NEW: Move reservation (for drag-drop)
  moveReservation: async (reservationId: string, newRoomId: string, newDates?: { checkInDate: string; checkOutDate: string }) => {
    get().setOperationStatus(reservationId, { modifying: true });
    try {
      await reservationService.moveReservation(reservationId, newRoomId, newDates);
      const hotelId = get().reservations[0]?.hotelId;
      if (hotelId) {
        await get().fetchReservations(hotelId);
      }
      get().setOperationStatus(reservationId, { modifying: false });
    } catch (error: any) {
      get().setOperationStatus(reservationId, { modifying: false, error: error.message });
      throw error;
    }
  },

  // ✨ NEW: Priority 3 - Modification with history
  modifyReservationWithHistory: async (reservationId: string, changes: Partial<Reservation>, reason?: string) => {
    get().setOperationStatus(reservationId, { modifying: true });
    try {
      await reservationService.modifyReservation(reservationId, changes, reason, 'current-user');
      const hotelId = get().reservations[0]?.hotelId;
      if (hotelId) {
        await get().fetchReservations(hotelId);
      }
      get().setOperationStatus(reservationId, { modifying: false });
    } catch (error: any) {
      get().setOperationStatus(reservationId, { modifying: false, error: error.message });
      throw error;
    }
  },

  // ✨ NEW: Get modification history
  getModificationHistory: async (reservationId: string) => {
    try {
      return await reservationService.getModificationHistory(reservationId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // ✨ NEW: Export reservations
  exportReservations: async (format: 'csv' | 'excel' | 'pdf', filters?: any) => {
    set({ loading: true });
    try {
      const hotelId = get().reservations[0]?.hotelId || 'hotel-1';
      return await reservationService.exportReservations(hotelId, filters || {}, format);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // ✨ NEW: Priority 4 - Performance optimization
  fetchReservationsPaginated: async (hotelId: string, page: number = 1, pageSize: number = 10) => {
    set({ loading: true, error: null });
    try {
      // Simulate pagination - in real app, this would be server-side
      const allReservations = await reservationService.getReservations(hotelId);
      const startIndex = (page - 1) * pageSize;
      const paginatedReservations = allReservations.slice(startIndex, startIndex + pageSize);
      
      set({ 
        reservations: paginatedReservations,
        loading: false,
        filter: { ...get().filter, pageNo: page, pageSize }
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // ✨ NEW: Detect conflicts
  detectConflicts: async (hotelId: string) => {
    try {
      return await reservationService.detectConflicts(hotelId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // ✨ NEW: Calculate occupancy
  calculateOccupancy: async (hotelId: string, startDate: string, endDate: string) => {
    try {
      return await reservationService.calculateOccupancy(hotelId, startDate, endDate);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));