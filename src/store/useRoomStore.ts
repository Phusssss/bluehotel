import { create } from 'zustand';
import type { Room, RoomFilter } from '../types';
import { roomService } from '../services/roomService';

interface RoomState {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  filter: RoomFilter;
  selectedRoom: Room | null;
  
  // Actions
  setRooms: (rooms: Room[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: RoomFilter) => void;
  setSelectedRoom: (room: Room | null) => void;
  
  // Async actions
  fetchRooms: (hotelId: string) => Promise<void>;
  createRoom: (roomData: Omit<Room, 'id'>) => Promise<void>;
  updateRoom: (roomId: string, roomData: Partial<Room>) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  loading: false,
  error: null,
  filter: {},
  selectedRoom: null,
  
  setRooms: (rooms) => set({ rooms }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilter: (filter) => set({ filter }),
  setSelectedRoom: (selectedRoom) => set({ selectedRoom }),
  
  fetchRooms: async (hotelId: string) => {
    set({ loading: true, error: null });
    try {
      const rooms = await roomService.getRooms(hotelId, get().filter);
      set({ rooms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  createRoom: async (roomData) => {
    set({ loading: true, error: null });
    try {
      await roomService.createRoom(roomData);
      await get().fetchRooms(roomData.hotelId);
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  updateRoom: async (roomId: string, roomData) => {
    set({ loading: true, error: null });
    try {
      await roomService.updateRoom(roomId, roomData);
      const { rooms } = get();
      const updatedRooms = rooms.map(room => 
        room.id === roomId ? { ...room, ...roomData } : room
      );
      set({ rooms: updatedRooms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  deleteRoom: async (roomId: string) => {
    set({ loading: true, error: null });
    try {
      await roomService.deleteRoom(roomId);
      const { rooms } = get();
      const filteredRooms = rooms.filter(room => room.id !== roomId);
      set({ rooms: filteredRooms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));