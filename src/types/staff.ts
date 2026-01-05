import type { BaseEntity, StaffPosition } from './common';

export interface Staff extends BaseEntity {
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: StaffPosition;
  department: string;
  salary: number;
  startDate: string;
  status: 'active' | 'inactive';
  permissions: string[];
}