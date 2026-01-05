import type { BaseEntity, IdType } from './common';

export interface Guest extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
  idType: IdType;
  address: string;
  country: string;
  totalStays: number;
  isVIP: boolean;
  notes?: string;
}

export interface GuestFilter {
  search?: string;
  isVIP?: boolean;
  country?: string;
}