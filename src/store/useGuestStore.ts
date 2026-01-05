import { create } from 'zustand';
import type { Guest, GuestFilter } from '../types';
import { guestService } from '../services/guestService';

interface GuestState {
  guests: Guest[];
  loading: boolean;
  error: string | null;
  filter: GuestFilter;
  selectedGuest: Guest | null;
  
  // Actions
  setGuests: (guests: Guest[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: GuestFilter) => void;
  setSelectedGuest: (guest: Guest | null) => void;
  
  // Async actions
  fetchGuests: () => Promise<void>;
  createGuest: (guestData: Omit<Guest, 'id'>) => Promise<void>;
  updateGuest: (guestId: string, guestData: Partial<Guest>) => Promise<void>;
  deleteGuest: (guestId: string) => Promise<void>;
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
  
  fetchGuests: async () => {
    set({ loading: true, error: null });
    try {
      const guests = await guestService.getGuests(get().filter);
      set({ guests, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  createGuest: async (guestData) => {
    set({ loading: true, error: null });
    try {
      await guestService.createGuest(guestData);
      await get().fetchGuests();
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  updateGuest: async (guestId: string, guestData) => {
    set({ loading: true, error: null });
    try {
      await guestService.updateGuest(guestId, guestData);
      const { guests } = get();
      const updatedGuests = guests.map(guest => 
        guest.id === guestId ? { ...guest, ...guestData } : guest
      );
      set({ guests: updatedGuests, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  deleteGuest: async (guestId: string) => {
    set({ loading: true, error: null });
    try {
      await guestService.deleteGuest(guestId);
      const { guests } = get();
      const filteredGuests = guests.filter(guest => guest.id !== guestId);
      set({ guests: filteredGuests, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));