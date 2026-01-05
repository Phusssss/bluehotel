import type { BaseEntity, StaffPosition } from './common';

export interface Staff extends BaseEntity {
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: StaffPosition;
  department?: string;
  role: 'admin' | 'manager' | 'staff';
  permissions: string[];
  salary?: number;
  startDate?: Date;
  status: 'active' | 'inactive' | 'terminated';
  isDeleted?: boolean;
  notes?: string;
  userId?: string; // Link to Firebase Auth user
  schedule?: WorkSchedule[];
  audit?: AuditEntry[];
}

export interface WorkSchedule {
  date: string;
  shift: 'morning' | 'afternoon' | 'night';
  notes?: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  byUserId: string;
  timestamp: Date;
  changes: Record<string, { from: any; to: any }>;
}

export interface StaffFilter {
  position?: StaffPosition;
  status?: 'active' | 'inactive' | 'terminated';
  department?: string;
  search?: string;
}

export interface HotelMembership {
  hotelId: string;
  role: string;
  permissions: string[];
  staffId?: string;
}

// Staff permissions
export const STAFF_PERMISSIONS = {
  VIEW_STAFFS: 'view_staffs',
  CREATE_STAFF: 'create_staff',
  UPDATE_STAFF: 'update_staff',
  DELETE_STAFF: 'delete_staff',
  MANAGE_STAFF_PERMISSIONS: 'manage_staff_permissions',
  VIEW_SALARY: 'view_salary',
  MANAGE_SCHEDULE: 'manage_schedule',
  VIEW_RESERVATIONS: 'view_reservations',
  CHECK_IN: 'check_in',
  MANAGE_ROOMS: 'manage_rooms',
  MANAGE_INVOICES: 'manage_invoices',
} as const;