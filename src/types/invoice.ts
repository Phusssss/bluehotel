import type { BaseEntity, PaymentStatus, PaymentMethod } from './common';

export interface AdditionalService {
  name: string;
  price: number;
}

export interface Invoice extends BaseEntity {
  hotelId: string;
  reservationId: string;
  guestId: string;
  roomCharges: number;
  additionalServices: AdditionalService[];
  taxes: number;
  discount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  issueDate: string;
  dueDate: string;
  notes?: string;
}