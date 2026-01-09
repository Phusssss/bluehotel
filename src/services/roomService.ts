import { apiClient } from './api';
import type { Room, RoomFilter } from '../types';

interface CreateRoomDto {
  room_number: string;
  room_type_id: number;
  floor: number;
  status: 'available' | 'occupied' | 'dirty' | 'cleaning' | 'maintenance';
  description?: string;
  amenities?: string[];
  images?: string[];
}

interface UpdateRoomDto {
  room_number?: string;
  room_type_id?: number;
  floor?: number;
  status?: 'available' | 'occupied' | 'dirty' | 'cleaning' | 'maintenance';
  description?: string;
  amenities?: string[];
  images?: string[];
}

interface RoomResponse {
  id: number;
  room_number: string;
  room_type_id: number;
  floor: number;
  status: string;
  description?: string;
  amenities?: string[];
  images?: string[];
  room_type?: {
    id: number;
    name: string;
    base_price: number;
    capacity: number;
    description?: string;
  };
  created_at: string;
  updated_at: string;
}

export const roomService = {
  // Get all rooms with filters
  async getRooms(filter?: RoomFilter): Promise<RoomResponse[]> {
    try {
      const params: any = {};
      
      if (filter?.status) params.status = filter.status;
      if (filter?.roomType) params.room_type_id = filter.roomType;
      if (filter?.floor) params.floor = filter.floor;
      if (filter?.limit) params.limit = filter.limit;
      if (filter?.offset) params.offset = filter.offset;

      const response = await apiClient.get<RoomResponse[]>('/rooms', { params });
      return response;
    } catch (error: any) {
      console.error('Error getting rooms:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách phòng');
    }
  },

  // Get room by ID
  async getRoomById(roomId: number): Promise<RoomResponse> {
    try {
      const response = await apiClient.get<RoomResponse>(`/rooms/${roomId}`);
      return response;
    } catch (error: any) {
      console.error('Error getting room:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin phòng');
    }
  },

  // Create room
  async createRoom(roomData: CreateRoomDto): Promise<RoomResponse> {
    try {
      const response = await apiClient.post<RoomResponse>('/rooms', roomData);
      return response;
    } catch (error: any) {
      console.error('Error creating room:', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo phòng mới');
    }
  },

  // Update room
  async updateRoom(roomId: number, roomData: UpdateRoomDto): Promise<RoomResponse> {
    try {
      const response = await apiClient.put<RoomResponse>(`/rooms/${roomId}`, roomData);
      return response;
    } catch (error: any) {
      console.error('Error updating room:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật phòng');
    }
  },

  // Update room status
  async updateRoomStatus(roomId: number, status: string): Promise<RoomResponse> {
    try {
      const response = await apiClient.put<RoomResponse>(`/rooms/${roomId}/status`, { status });
      return response;
    } catch (error: any) {
      console.error('Error updating room status:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái phòng');
    }
  },

  // Delete room
  async deleteRoom(roomId: number): Promise<void> {
    try {
      await apiClient.delete(`/rooms/${roomId}`);
    } catch (error: any) {
      console.error('Error deleting room:', error);
      throw new Error(error.response?.data?.message || 'Không thể xóa phòng');
    }
  },

  // Get available rooms for date range
  async getAvailableRooms(checkIn: string, checkOut: string): Promise<RoomResponse[]> {
    try {
      const response = await apiClient.get<RoomResponse[]>('/rooms/available', {
        params: {
          check_in: checkIn,
          check_out: checkOut,
        },
      });
      return response;
    } catch (error: any) {
      console.error('Error getting available rooms:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách phòng trống');
    }
  },

  // Get room types
  async getRoomTypes(): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>('/room-types');
      return response;
    } catch (error: any) {
      console.error('Error getting room types:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách loại phòng');
    }
  },

  // Create room type
  async createRoomType(data: any): Promise<any> {
    try {
      const response = await apiClient.post<any>('/room-types', data);
      return response;
    } catch (error: any) {
      console.error('Error creating room type:', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo loại phòng mới');
    }
  },

  // Update room type
  async updateRoomType(id: number, data: any): Promise<any> {
    try {
      const response = await apiClient.put<any>(`/room-types/${id}`, data);
      return response;
    } catch (error: any) {
      console.error('Error updating room type:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật loại phòng');
    }
  },

  // Delete room type
  async deleteRoomType(id: number): Promise<void> {
    try {
      await apiClient.delete(`/room-types/${id}`);
    } catch (error: any) {
      console.error('Error deleting room type:', error);
      throw new Error(error.response?.data?.message || 'Không thể xóa loại phòng');
    }
  },

  // Get room statistics
  async getRoomStats(): Promise<any> {
    try {
      const response = await apiClient.get<any>('/rooms/stats');
      return response;
    } catch (error: any) {
      console.error('Error getting room stats:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thống kê phòng');
    }
  },
};