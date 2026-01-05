import type { BaseEntity, ReservationStatus } from './common';

export interface Reservation extends BaseEntity {
  hotelId: string;
  guestId: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  status: ReservationStatus;
  totalPrice: number;
  notes?: string;
  specialRequests?: string;
  
  // ✨ Enhanced fields
  actualCheckInTime?: string;
  actualCheckOutTime?: string;
  priceBreakdown?: {
    basePrice: number;
    taxes: number;
    fees: number;
    discounts: number;
  };
  guestPreferences?: Record<string, any>;
  modificationHistory?: ModificationLog[];
  source: 'online' | 'phone' | 'walk-in' | 'agent';
  confirmationCode: string;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  
  // ✨ NEW: Priority 3 fields
  roomNumber?: string;
  guestName?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface ModificationLog {
  id: string;
  timestamp: Date;
  modifiedBy: string;
  changes: Record<string, { from: any; to: any }>;
  reason?: string;
}

export interface AvailableRoom {
  room: any;
  availablePrice: number;
  discountedPrice?: number;
  isRecommended?: boolean;
}

// ✨ NEW: Priority 3 interfaces
export interface ConflictReport {
  conflicts: Array<{
    roomId: string;
    date: string;
    reservations: Reservation[];
  }>;
  totalConflicts: number;
  affectedRooms: string[];
}

export interface OccupancyReport {
  dateRange: { start: string; end: string };
  dailyOccupancy: Array<{
    date: string;
    occupiedRooms: number;
    totalRooms: number;
    percentage: number;
  }>;
  averageOccupancy: number;
}

export interface ReservationFilter {
  status?: ReservationStatus;
  dateRange?: [string, string];
  guestName?: string;
  roomNumber?: string;
  source?: string;
  paymentStatus?: string;
  sortBy?: 'checkInDate' | 'checkOutDate' | 'createdAt' | 'totalPrice';
  sortOrder?: 'asc' | 'desc';
  pageNo?: number;
  pageSize?: number;
}