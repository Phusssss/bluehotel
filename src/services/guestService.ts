import { apiClient } from './api';
import type { Guest, GuestFilter } from '../types';

interface CreateGuestDto {
  name: string;
  email: string;
  phone: string;
  address?: string;
  nationality?: string;
  date_of_birth?: string;
  id_number?: string;
  preferences?: string;
  is_vip?: boolean;
  loyalty_points?: number;
}

interface UpdateGuestDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  nationality?: string;
  date_of_birth?: string;
  id_number?: string;
  preferences?: string;
  is_vip?: boolean;
  loyalty_points?: number;
}

interface GuestResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  nationality?: string;
  date_of_birth?: string;
  id_number?: string;
  preferences?: string;
  is_vip: boolean;
  loyalty_points: number;
  total_stays: number;
  total_spent: number;
  last_stay?: string;
  created_at: string;
  updated_at: string;
}

export const guestService = {
  // Get all guests
  async getGuests(filter?: GuestFilter): Promise<GuestResponse[]> {
    try {
      const params: any = {};
      
      if (filter?.isVIP !== undefined) params.is_vip = filter.isVIP;
      if (filter?.nationality) params.nationality = filter.nationality;
      if (filter?.search) params.search = filter.search;
      if (filter?.limit) params.limit = filter.limit;
      if (filter?.offset) params.offset = filter.offset;

      const response = await apiClient.get<GuestResponse[]>('/guests', { params });
      return response;
    } catch (error: any) {
      console.error('Error getting guests:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách khách hàng');
    }
  },

  // Get guest by ID
  async getGuestById(guestId: number): Promise<GuestResponse> {
    try {
      const response = await apiClient.get<GuestResponse>(`/guests/${guestId}`);
      return response;
    } catch (error: any) {
      console.error('Error getting guest:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin khách hàng');
    }
  },

  // Create guest
  async createGuest(guestData: CreateGuestDto): Promise<GuestResponse> {
    try {
      const response = await apiClient.post<GuestResponse>('/guests', guestData);
      return response;
    } catch (error: any) {
      console.error('Error creating guest:', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo khách hàng mới');
    }
  },

  // Update guest
  async updateGuest(guestId: number, guestData: UpdateGuestDto): Promise<GuestResponse> {
    try {
      const response = await apiClient.put<GuestResponse>(`/guests/${guestId}`, guestData);
      return response;
    } catch (error: any) {
      console.error('Error updating guest:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật khách hàng');
    }
  },

  // Delete guest
  async deleteGuest(guestId: number): Promise<void> {
    try {
      await apiClient.delete(`/guests/${guestId}`);
    } catch (error: any) {
      console.error('Error deleting guest:', error);
      throw new Error(error.response?.data?.message || 'Không thể xóa khách hàng');
    }
  },

  // Search guests
  async searchGuests(query: string): Promise<GuestResponse[]> {
    try {
      const response = await apiClient.get<GuestResponse[]>('/guests/search', {
        params: { q: query },
      });
      return response;
    } catch (error: any) {
      console.error('Error searching guests:', error);
      throw new Error(error.response?.data?.message || 'Không thể tìm kiếm khách hàng');
    }
  },

  // Get guest history
  async getGuestHistory(guestId: number): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>(`/guests/${guestId}/history`);
      return response;
    } catch (error: any) {
      console.error('Error getting guest history:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải lịch sử khách hàng');
    }
  },

  // Get guest reservations
  async getGuestReservations(guestId: number): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>(`/guests/${guestId}/reservations`);
      return response;
    } catch (error: any) {
      console.error('Error getting guest reservations:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách đặt phòng của khách hàng');
    }
  },

  // Update loyalty points
  async updateLoyaltyPoints(guestId: number, points: number): Promise<GuestResponse> {
    try {
      const response = await apiClient.post<GuestResponse>(`/guests/${guestId}/loyalty-points`, {
        points,
      });
      return response;
    } catch (error: any) {
      console.error('Error updating loyalty points:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật điểm thành viên');
    }
  },

  // Get VIP guests
  async getVIPGuests(): Promise<GuestResponse[]> {
    try {
      const response = await apiClient.get<GuestResponse[]>('/guests/vip');
      return response;
    } catch (error: any) {
      console.error('Error getting VIP guests:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách khách VIP');
    }
  },

  // Get guest statistics
  async getGuestStats(): Promise<any> {
    try {
      const response = await apiClient.get<any>('/guests/stats');
      return response;
    } catch (error: any) {
      console.error('Error getting guest stats:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thống kê khách hàng');
    }
  },
};