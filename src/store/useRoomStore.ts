import { create } from 'zustand';
import type { Room, RoomFilter, RoomStatus } from '../types';
import { roomService } from '../services/roomService';

interface RoomState {
  rooms: any[];
  loading: boolean;
  error: string | null;
  filter: RoomFilter;
  selectedRoom: any | null;
  selectedRooms: number[];
  
  // Actions
  setRooms: (rooms: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: RoomFilter) => void;
  setSelectedRoom: (room: any | null) => void;
  setSelectedRooms: (roomIds: number[]) => void;
  toggleRoomSelection: (roomId: number) => void;
  clearSelection: () => void;
  
  // Async actions
  fetchRooms: (filter?: RoomFilter) => Promise<void>;
  createRoom: (roomData: any) => Promise<void>;
  updateRoom: (roomId: number, roomData: any) => Promise<void>;
  deleteRoom: (roomId: number) => Promise<void>;
  updateRoomStatus: (roomId: number, status: string) => Promise<void>;
  bulkUpdateStatus: (roomIds: number[], status: string) => Promise<void>;
  bulkDelete: (roomIds: number[]) => Promise<void>;
  fetchRoomTypes: () => Promise<any[]>;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  loading: false,
  error: null,
  filter: {},
  selectedRoom: null,
  selectedRooms: [],
  
  setRooms: (rooms) => set({ rooms }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilter: (filter) => set({ filter }),
  setSelectedRoom: (selectedRoom) => set({ selectedRoom }),
  setSelectedRooms: (selectedRooms) => set({ selectedRooms }),
  toggleRoomSelection: (roomId) => {
    const { selectedRooms } = get();
    const newSelection = selectedRooms.includes(roomId)
      ? selectedRooms.filter(id => id !== roomId)
      : [...selectedRooms, roomId];
    set({ selectedRooms: newSelection });
  },
  clearSelection: () => set({ selectedRooms: [] }),
  
  fetchRooms: async (filter?: RoomFilter) => {
    set({ loading: true, error: null });
    try {
      const rooms = await roomService.getRooms(filter);
      set({ rooms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  createRoom: async (roomData) => {
    set({ loading: true, error: null });
    try {
      const newRoom = await roomService.createRoom(roomData);
      const { rooms } = get();
      set({ rooms: [...rooms, newRoom], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  updateRoom: async (roomId: number, roomData) => {
    set({ loading: true, error: null });
    try {
      const updatedRoom = await roomService.updateRoom(roomId, roomData);
      const { rooms } = get();
      const updatedRooms = rooms.map(room => 
        room.id === roomId ? updatedRoom : room
      );
      set({ rooms: updatedRooms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  updateRoomStatus: async (roomId: number, status: string) => {
    set({ loading: true, error: null });
    try {
      const updatedRoom = await roomService.updateRoomStatus(roomId, status);
      const { rooms } = get();
      const updatedRooms = rooms.map(room => 
        room.id === roomId ? updatedRoom : room
      );
      set({ rooms: updatedRooms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  deleteRoom: async (roomId: number) => {
    set({ loading: true, error: null });
    try {
      await roomService.deleteRoom(roomId);
      const { rooms } = get();
      const filteredRooms = rooms.filter(room => room.id !== roomId);
      set({ rooms: filteredRooms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  bulkUpdateStatus: async (roomIds: number[], status: string) => {
    set({ loading: true, error: null });
    try {
      await Promise.all(
        roomIds.map(id => roomService.updateRoomStatus(id, status))
      );
      const { rooms } = get();
      const updatedRooms = rooms.map(room => 
        roomIds.includes(room.id) ? { ...room, status } : room
      );
      set({ rooms: updatedRooms, loading: false, selectedRooms: [] });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  bulkDelete: async (roomIds: number[]) => {
    set({ loading: true, error: null });
    try {
      await Promise.all(
        roomIds.map(id => roomService.deleteRoom(id))
      );
      const { rooms } = get();
      const filteredRooms = rooms.filter(room => !roomIds.includes(room.id));
      set({ rooms: filteredRooms, loading: false, selectedRooms: [] });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  fetchRoomTypes: async () => {
    try {
      return await roomService.getRoomTypes();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));