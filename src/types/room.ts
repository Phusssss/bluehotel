import type { BaseEntity, RoomStatus, RoomType } from './common';

export interface Room extends BaseEntity {
  hotelId: string;
  roomNumber: string;
  roomType: RoomType;
  maxGuests: number;
  basePrice: number;
  status: RoomStatus;
  floor: number;
  amenities: string[];
  images: string[];
  lastUpdated: Date;
}

export interface RoomFilter {
  status?: RoomStatus;
  roomType?: RoomType;
  floor?: number;
  priceRange?: [number, number];
  search?: string;
}