export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Hotel extends BaseEntity {
  name: string;
  address: string;
  phone: string;
  email: string;
  totalRooms: number;
  logo?: string;
  settings?: Record<string, any>;
}

export interface User extends BaseEntity {
  email: string;
  role: 'admin' | 'manager' | 'staff';
  hotelId: string;
  staffId?: string;
  permissions: string[];
  lastLogin?: Date;
  isActive: boolean;
  memberships?: HotelMembership[]; // Multi-hotel support
  activeHotelId?: string; // Currently selected hotel
}

export interface HotelMembership {
  hotelId: string;
  role: string;
  permissions: string[];
  staffId?: string;
}

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'blocked' | 'cleaning' | 'out-of-order';
export type RoomType = 'single' | 'double' | 'suite' | 'deluxe';
export type ReservationStatus = 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'partial';
export type PaymentMethod = 'cash' | 'credit_card' | 'bank_transfer';
export type StaffPosition = 'manager' | 'receptionist' | 'housekeeper' | 'maintenance' | 'accounting';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'pending' | 'in-progress' | 'completed';
export type ServiceCategory = 'food' | 'laundry' | 'spa' | 'transport' | 'other';
export type ReportType = 'occupancy' | 'revenue' | 'expense' | 'guest';
export type IdType = 'passport' | 'national_id' | 'driver_license';