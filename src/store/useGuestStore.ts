import { create } from 'zustand';
import type { Guest, GuestFilter } from '../types';
import { guestService } from '../services/guestService';

interface GuestState {
  guests: any[];
  loading: boolean;
  error: string | null;
  filter: GuestFilter;
  selectedGuest: any | null;
  
  // Actions
  setGuests: (guests: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: GuestFilter) => void;
  setSelectedGuest: (guest: any | null) => void;
  
  // Async actions
  fetchGuests: (filter?: GuestFilter) => Promise<void>;
  createGuest: (guestData: any) => Promise<void>;
  updateGuest: (guestId: number, guestData: any) => Promise<void>;
  deleteGuest: (guestId: number) => Promise<void>;
  searchGuests: (query: string) => Promise<any[]>;
  getGuestHistory: (guestId: number) => Promise<any[]>;
  getGuestReservations: (guestId: number) => Promise<any[]>;
  updateLoyaltyPoints: (guestId: number, points: number) => Promise<void>;
  getVIPGuests: () => Promise<any[]>;
}

export const useGuestStore = create<GuestState>((set, get) => ({
  guests: [],
  loading: false,
  error: null,
  filter: {},
  selectedGuest: null,
  
  setGuests: (guests) => set({ guests }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilter: (filter) => set({ filter }),
  setSelectedGuest: (selectedGuest) => set({ selectedGuest }),
  
  fetchGuests: async (filter?: GuestFilter) => {
    set({ loading: true, error: null });
    try {
      const guests = await guestService.getGuests(filter || get().filter);
      set({ guests, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  createGuest: async (guestData) => {
    set({ loading: true, error: null });
    try {
      const newGuest = await guestService.createGuest(guestData);
      const { guests } = get();
      set({ guests: [...guests, newGuest], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  updateGuest: async (guestId: number, guestData) => {
    set({ loading: true, error: null });
    try {
      const updatedGuest = await guestService.updateGuest(guestId, guestData);
      const { guests } = get();
      const updatedGuests = guests.map(guest => 
        guest.id === guestId ? updatedGuest : guest
      );
      set({ guests: updatedGuests, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  deleteGuest: async (guestId: number) => {
    set({ loading: true, error: null });
    try {
      await guestService.deleteGuest(guestId);
      const { guests } = get();
      const filteredGuests = guests.filter(guest => guest.id !== guestId);
      set({ guests: filteredGuests, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  searchGuests: async (query: string) => {
    try {
      return await guestService.searchGuests(query);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
  
  getGuestHistory: async (guestId: number) => {
    try {
      return await guestService.getGuestHistory(guestId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
  
  getGuestReservations: async (guestId: number) => {
    try {
      return await guestService.getGuestReservations(guestId);
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
  
  updateLoyaltyPoints: async (guestId: number, points: number) => {
    set({ loading: true, error: null });
    try {
      const updatedGuest = await guestService.updateLoyaltyPoints(guestId, points);
      const { guests } = get();
      const updatedGuests = guests.map(guest => 
        guest.id === guestId ? updatedGuest : guest
      );
      set({ guests: updatedGuests, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  getVIPGuests: async () => {
    try {
      return await guestService.getVIPGuests();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));