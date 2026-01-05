import { create } from 'zustand';
import type { Room, RoomFilter, RoomStatus } from '../types';
import { roomService } from '../services/roomService';
import type { DocumentSnapshot } from 'firebase/firestore';

interface RoomState {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  filter: RoomFilter;
  selectedRoom: Room | null;
  selectedRooms: string[];
  hasMore: boolean;
  lastDoc: DocumentSnapshot | null;
  
  // Actions
  setRooms: (rooms: Room[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: RoomFilter) => void;
  setSelectedRoom: (room: Room | null) => void;
  setSelectedRooms: (roomIds: string[]) => void;
  toggleRoomSelection: (roomId: string) => void;
  clearSelection: () => void;
  
  // Async actions
  fetchRooms: (hotelId: string, reset?: boolean) => Promise<void>;
  loadMoreRooms: (hotelId: string) => Promise<void>;
  createRoom: (roomData: Omit<Room, 'id'>) => Promise<void>;
  updateRoom: (roomId: string, roomData: Partial<Room>) => Promise<void>;
  deleteRoom: (roomId: string, force?: boolean) => Promise<void>;
  bulkUpdateStatus: (roomIds: string[], status: RoomStatus) => Promise<void>;
  bulkDelete: (roomIds: string[], force?: boolean) => Promise<void>;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  loading: false,
  error: null,
  filter: {},
  selectedRoom: null,
  selectedRooms: [],
  hasMore: true,
  lastDoc: null,
  
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
  
  fetchRooms: async (hotelId: string, reset = true) => {
    set({ loading: true, error: null });
    if (reset) set({ rooms: [], lastDoc: null, hasMore: true });
    
    try {
      const { filter, lastDoc } = get();
      const { rooms, lastDoc: newLastDoc } = await roomService.getRooms(hotelId, {
        ...filter,
        limit: 20,
        startAfter: reset ? undefined : lastDoc || undefined
      });
      
      const currentRooms = reset ? [] : get().rooms;
      set({ 
        rooms: [...currentRooms, ...rooms],
        lastDoc: newLastDoc,
        loading: false,
        hasMore: rooms.length === 20
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  loadMoreRooms: async (hotelId: string) => {
    const { hasMore, loading } = get();
    if (!hasMore || loading) return;
    await get().fetchRooms(hotelId, false);
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
  
  deleteRoom: async (roomId: string, force = false) => {
    set({ loading: true, error: null });
    try {
      await roomService.deleteRoom(roomId, force);
      const { rooms } = get();
      const filteredRooms = rooms.filter(room => room.id !== roomId);
      set({ rooms: filteredRooms, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  bulkUpdateStatus: async (roomIds: string[], status: RoomStatus) => {
    set({ loading: true, error: null });
    try {
      await Promise.all(
        roomIds.map(id => roomService.updateRoom(id, { status }))
      );
      const { rooms } = get();
      const updatedRooms = rooms.map(room => 
        roomIds.includes(room.id!) ? { ...room, status } : room
      );
      set({ rooms: updatedRooms, loading: false, selectedRooms: [] });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  
  bulkDelete: async (roomIds: string[], force = false) => {
    set({ loading: true, error: null });
    try {
      await Promise.all(
        roomIds.map(id => roomService.deleteRoom(id, force))
      );
      const { rooms } = get();
      const filteredRooms = rooms.filter(room => !roomIds.includes(room.id!));
      set({ rooms: filteredRooms, loading: false, selectedRooms: [] });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));