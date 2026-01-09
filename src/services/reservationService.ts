import { apiClient } from './api';
import type { Reservation, ReservationFilter } from '../types';

interface CreateReservationDto {
  guest_id: number;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  special_requests?: string;
  booking_reference?: string;
}

interface UpdateReservationDto {
  guest_id?: number;
  room_id?: number;
  check_in_date?: string;
  check_out_date?: string;
  number_of_guests?: number;
  special_requests?: string;
  status?: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
}

interface ReservationResponse {
  id: number;
  guest_id: number;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  status: string;
  total_amount: number;
  special_requests?: string;
  booking_reference: string;
  guest?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  room?: {
    id: number;
    room_number: string;
    room_type: {
      name: string;
      base_price: number;
    };
  };
  created_at: string;
  updated_at: string;
}

export const reservationService = {
  // Get all reservations
  async getReservations(filter?: ReservationFilter): Promise<ReservationResponse[]> {
    try {
      const params: any = {};
      
      if (filter?.status) params.status = filter.status;
      if (filter?.dateRange) {
        params.start_date = filter.dateRange.start;
        params.end_date = filter.dateRange.end;
      }
      if (filter?.roomId) params.room_id = filter.roomId;
      if (filter?.guestId) params.guest_id = filter.guestId;

      const response = await apiClient.get<ReservationResponse[]>('/reservations', { params });
      return response;
    } catch (error: any) {
      console.error('Error getting reservations:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách đặt phòng');
    }
  },

  // Get reservation by ID
  async getReservationById(reservationId: number): Promise<ReservationResponse> {
    try {
      const response = await apiClient.get<ReservationResponse>(`/reservations/${reservationId}`);
      return response;
    } catch (error: any) {
      console.error('Error getting reservation:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin đặt phòng');
    }
  },

  // Create reservation
  async createReservation(reservationData: CreateReservationDto): Promise<ReservationResponse> {
    try {
      const response = await apiClient.post<ReservationResponse>('/reservations', reservationData);
      return response;
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      throw new Error(error.response?.data?.message || 'Không thể tạo đặt phòng mới');
    }
  },

  // Update reservation
  async updateReservation(reservationId: number, reservationData: UpdateReservationDto): Promise<ReservationResponse> {
    try {
      const response = await apiClient.put<ReservationResponse>(`/reservations/${reservationId}`, reservationData);
      return response;
    } catch (error: any) {
      console.error('Error updating reservation:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật đặt phòng');
    }
  },

  // Delete reservation
  async deleteReservation(reservationId: number): Promise<void> {
    try {
      await apiClient.delete(`/reservations/${reservationId}`);
    } catch (error: any) {
      console.error('Error deleting reservation:', error);
      throw new Error(error.response?.data?.message || 'Không thể xóa đặt phòng');
    }
  },

  // Check-in process
  async checkIn(reservationId: number, checkInData?: { notes?: string }): Promise<ReservationResponse> {
    try {
      const response = await apiClient.post<ReservationResponse>(`/reservations/${reservationId}/check-in`, checkInData || {});
      return response;
    } catch (error: any) {
      console.error('Error checking in:', error);
      throw new Error(error.response?.data?.message || 'Không thể check-in');
    }
  },

  // Check-out process
  async checkOut(reservationId: number, checkOutData?: { notes?: string }): Promise<ReservationResponse> {
    try {
      const response = await apiClient.post<ReservationResponse>(`/reservations/${reservationId}/check-out`, checkOutData || {});
      return response;
    } catch (error: any) {
      console.error('Error checking out:', error);
      throw new Error(error.response?.data?.message || 'Không thể check-out');
    }
  },

  // Cancel reservation
  async cancelReservation(reservationId: number, reason?: string): Promise<ReservationResponse> {
    try {
      const response = await apiClient.post<ReservationResponse>(`/reservations/${reservationId}/cancel`, { reason });
      return response;
    } catch (error: any) {
      console.error('Error cancelling reservation:', error);
      throw new Error(error.response?.data?.message || 'Không thể hủy đặt phòng');
    }
  },

  // Check availability
  async checkAvailability(
    roomId: number,
    checkInDate: string,
    checkOutDate: string,
    excludeReservationId?: number
  ): Promise<{ available: boolean; conflicts: ReservationResponse[] }> {
    try {
      const params: any = {
        room_id: roomId,
        check_in: checkInDate,
        check_out: checkOutDate,
      };
      
      if (excludeReservationId) {
        params.exclude_reservation_id = excludeReservationId;
      }

      const response = await apiClient.get<{ available: boolean; conflicts: ReservationResponse[] }>('/reservations/check-availability', { params });
      return response;
    } catch (error: any) {
      console.error('Error checking availability:', error);
      throw new Error(error.response?.data?.message || 'Không thể kiểm tra tình trạng phòng');
    }
  },

  // Get available rooms
  async getAvailableRooms(
    checkInDate: string,
    checkOutDate: string,
    numberOfGuests: number
  ): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>('/rooms/available', {
        params: {
          check_in: checkInDate,
          check_out: checkOutDate,
          guests: numberOfGuests,
        },
      });
      return response;
    } catch (error: any) {
      console.error('Error getting available rooms:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách phòng trống');
    }
  },

  // Get reservations by room
  async getReservationsByRoom(roomId: number): Promise<ReservationResponse[]> {
    try {
      const response = await apiClient.get<ReservationResponse[]>(`/rooms/${roomId}/reservations`);
      return response;
    } catch (error: any) {
      console.error('Error getting reservations by room:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách đặt phòng theo phòng');
    }
  },

  // Get reservation audit log
  async getReservationAudit(reservationId: number): Promise<any[]> {
    try {
      const response = await apiClient.get<any[]>(`/reservations/${reservationId}/audit`);
      return response;
    } catch (error: any) {
      console.error('Error getting reservation audit:', error);
      throw new Error(error.response?.data?.message || 'Không thể tải lịch sử thay đổi');
    }
  },

  // Bulk operations
  async bulkUpdateReservations(reservationIds: number[], updates: UpdateReservationDto): Promise<void> {
    try {
      await apiClient.post('/reservations/bulk-update', {
        reservation_ids: reservationIds,
        updates,
      });
    } catch (error: any) {
      console.error('Error bulk updating reservations:', error);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật hàng loạt');
    }
  },

  async bulkDeleteReservations(reservationIds: number[]): Promise<void> {
    try {
      await apiClient.post('/reservations/bulk-delete', {
        reservation_ids: reservationIds,
      });
    } catch (error: any) {
      console.error('Error bulk deleting reservations:', error);
      throw new Error(error.response?.data?.message || 'Không thể xóa hàng loạt');
    }
  },

  // Move reservation (for drag-drop)
  async moveReservation(reservationId: number, newRoomId: number, newDates?: {
    checkInDate: string;
    checkOutDate: string;
  }): Promise<ReservationResponse> {
    try {
      const data: any = { room_id: newRoomId };
      if (newDates) {
        data.check_in_date = newDates.checkInDate;
        data.check_out_date = newDates.checkOutDate;
      }
      
      const response = await apiClient.post<ReservationResponse>(`/reservations/${reservationId}/move`, data);
      return response;
    } catch (error: any) {
      console.error('Error moving reservation:', error);
      throw new Error(error.response?.data?.message || 'Không thể chuyển đặt phòng');
    }
  },

  // Export reservations
  async exportReservations(
    filters: any,
    format: 'csv' | 'excel' | 'pdf'
  ): Promise<Blob> {
    try {
      const response = await apiClient.get('/reservations/export', {
        params: { ...filters, format },
        responseType: 'blob',
      });
      return response as unknown as Blob;
    } catch (error: any) {
      console.error('Error exporting reservations:', error);
      throw new Error(error.response?.data?.message || 'Không thể xuất dữ liệu');
    }
  },

  // Detect conflicts
  async detectConflicts(): Promise<any> {
    try {
      const response = await apiClient.get<any>('/reservations/conflicts');
      return response;
    } catch (error: any) {
      console.error('Error detecting conflicts:', error);
      throw new Error(error.response?.data?.message || 'Không thể kiểm tra xung đột');
    }
  },

  // Calculate occupancy
  async calculateOccupancy(
    startDate: string,
    endDate: string
  ): Promise<any> {
    try {
      const response = await apiClient.get<any>('/reservations/occupancy', {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });
      return response;
    } catch (error: any) {
      console.error('Error calculating occupancy:', error);
      throw new Error(error.response?.data?.message || 'Không thể tính tỷ lệ lấp đầy');
    }
  },
};