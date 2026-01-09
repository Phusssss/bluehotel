import { create } from 'zustand';
import type { Reservation, ReservationFilter } from '../types';
import { reservationService } from '../services/reservationService';

interface ReservationState {
  reservations: any[];
  loading: boolean;
  error: string | null;
  filter: ReservationFilter;
  selectedReservation: any | null;
  availableRooms: any[];
  
  // Actions
  setReservations: (reservations: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: ReservationFilter) => void;
  setSelectedReservation: (reservation: any | null) => void;
  setAvailableRooms: (rooms: any[]) => void;
  
  // Async actions
  fetchReservations: (filter?: ReservationFilter) => Promise<void>;
  createReservation: (reservationData: any) => Promise<void>;
  updateReservation: (reservationId: number, reservationData: any) => Promise<void>;
  deleteReservation: (reservationId: number) => Promise<void>;
  
  // Enhanced actions
  fetchAvailableRooms: (checkIn: string, checkOut: string, numberOfGuests: number) => Promise<void>;
  checkInReservation: (reservationId: number, checkInData?: any) => Promise<void>;
  checkOutReservation: (reservationId: number, checkOutData?: any) => Promise<void>;
  cancelReservation: (reservationId: number, reason?: string) => Promise<void>;
  checkAvailability: (roomId: number, checkIn: string, checkOut: string, excludeId?: number) => Promise<{available: boolean; conflicts: any[]}>;
  
  // Bulk operations
  bulkUpdate: (reservationIds: number[], updates: any) => Promise<void>;
  bulkDelete: (reservationIds: number[]) => Promise<void>;
  moveReservation: (reservationId: number, newRoomId: number, newDates?: { checkInDate: string; checkOutDate: string }) => Promise<void>;
  
  // Export and analytics
  exportReservations: (format: 'csv' | 'excel' | 'pdf', filters?: any) => Promise<Blob>;
  detectConflicts: () => Promise<any>;
  calculateOccupancy: (startDate: string, endDate: string) => Promise<any>;
}

export const useReservationStore = create<ReservationState>((set, get) => ({
  reservations: [],
  loading: false,
  error: null,
  filter: {},
  selectedReservation: null,
  availableRooms: [],
  
  setReservations: (reservations) => set({ reservations }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilter: (filter) => set({ filter }),
  setSelectedReservation: (selectedReservation) => set({ selectedReservation }),
  setAvailableRooms: (availableRooms) => set({ availableRooms }),
  
  fetchReservations: async (filter?: ReservationFilter) => {
    set({ loading: true, error: null });
    try {
      const reservations = await reservationService.getReservations(filter);
      set({ reservations, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  createReservation: async (reservationData) => {
    set({ loading: true, error: null });
    try {
      const newReservation = await reservationService.createReservation(reservationData);
      const { reservations } = get();
      set({ reservations: [...reservations, newReservation], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  updateReservation: async (reservationId: number, reservationData) => {
    set({ loading: true, error: null });
    try {
      const updatedReservation = await reservationService.updateReservation(reservationId, reservationData);
      const { reservations } = get();
      const updatedReservations = reservations.map(reservation => 
        reservation.id === reservationId ? updatedReservation : reservation
      );
      set({ reservations: updatedReservations, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  deleteReservation: async (reservationId: number) => {
    set({ loading: true, error: null });
    try {
      await reservationService.deleteReservation(reservationId);
      const { reservations } = get();
      const filteredReservations = reservations.filter(reservation => reservation.id !== reservationId);
      set({ reservations: filteredReservations, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  // Enhanced actions
  fetchAvailableRooms: async (checkIn: string, checkOut: string, numberOfGuests: number) => {
    set({ loading: true, error: null });
    try {
      const availableRooms = await reservationService.getAvailableRooms(checkIn, checkOut, numberOfGuests);
      set({ availableRooms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  checkInReservation: async (reservationId: number, checkInData?: any) => {
    set({ loading: true, error: null });
    try {
      const updatedReservation = await reservationService.checkIn(reservationId, checkInData);
      const { reservations } = get();
      const updatedReservations = reservations.map(reservation => 
        reservation.id === reservationId ? updatedReservation : reservation
      );
      set({ reservations: updatedReservations, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  checkOutReservation: async (reservationId: number, checkOutData?: any) => {
    set({ loading: true, error: null });
    try {
      const updatedReservation = await reservationService.checkOut(reservationId, checkOutData);
      const { reservations } = get();
      const updatedReservations = reservations.map(reservation => 
        reservation.id === reservationId ? updatedReservation : reservation
      );
      set({ reservations: updatedReservations, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  cancelReservation: async (reservationId: number, reason?: string) => {
    set({ loading: true, error: null });
    try {
      const updatedReservation = await reservationService.cancelReservation(reservationId, reason);
      const { reservations } = get();
      const updatedReservations = reservations.map(reservation => 
        reservation.id === reservationId ? updatedReservation : reservation
      );
      set({ reservations: updatedReservations, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  checkAvailability: async (roomId: number, checkIn: string, checkOut: string, excludeId?: number) => {
    try {
      return await reservationService.checkAvailability(roomId, checkIn, checkOut, excludeId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Bulk operations
  bulkUpdate: async (reservationIds: number[], updates: any) => {
    set({ loading: true, error: null });
    try {
      await reservationService.bulkUpdateReservations(reservationIds, updates);
      await get().fetchReservations();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  bulkDelete: async (reservationIds: number[]) => {
    set({ loading: true, error: null });
    try {
      await reservationService.bulkDeleteReservations(reservationIds);
      await get().fetchReservations();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Move reservation (for drag-drop)
  moveReservation: async (reservationId: number, newRoomId: number, newDates?: { checkInDate: string; checkOutDate: string }) => {
    set({ loading: true, error: null });
    try {
      const updatedReservation = await reservationService.moveReservation(reservationId, newRoomId, newDates);
      const { reservations } = get();
      const updatedReservations = reservations.map(reservation => 
        reservation.id === reservationId ? updatedReservation : reservation
      );
      set({ reservations: updatedReservations, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Export reservations
  exportReservations: async (format: 'csv' | 'excel' | 'pdf', filters?: any) => {
    set({ loading: true });
    try {
      return await reservationService.exportReservations(filters || {}, format);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Detect conflicts
  detectConflicts: async () => {
    try {
      return await reservationService.detectConflicts();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  // Calculate occupancy
  calculateOccupancy: async (startDate: string, endDate: string) => {
    try {
      return await reservationService.calculateOccupancy(startDate, endDate);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));