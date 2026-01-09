import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Guest } from './Guest';
import { Room } from './Room';
import { User } from './User';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  CANCELLED = 'cancelled'
}

export enum ReservationSource {
  DIRECT = 'direct',
  BOOKING_COM = 'booking.com',
  AGODA = 'agoda',
  AIRBNB = 'airbnb',
  PHONE = 'phone',
  EMAIL = 'email'
}

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'guest_id' })
  guestId: number;

  @Column({ name: 'room_id' })
  roomId: number;

  @Column({ name: 'check_in_date' })
  checkInDate: Date;

  @Column({ name: 'check_out_date' })
  checkOutDate: Date;

  @Column({ name: 'number_of_guests' })
  numberOfGuests: number;

  @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.PENDING })
  status: ReservationStatus;

  @Column({ name: 'room_rate', type: 'decimal', precision: 10, scale: 2 })
  roomRate: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ name: 'special_requests', type: 'text', nullable: true })
  specialRequests?: string;

  @Column({ type: 'enum', enum: ReservationSource, default: ReservationSource.DIRECT })
  source: ReservationSource;

  @Column({ name: 'booking_reference', nullable: true })
  bookingReference?: string;

  @Column({ name: 'created_by_id', nullable: true })
  createdById?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @ManyToOne(() => Guest, guest => guest.reservations)
  @JoinColumn({ name: 'guest_id' })
  guest: Guest;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: User;

  get numberOfNights(): number {
    const checkIn = new Date(this.checkInDate);
    const checkOut = new Date(this.checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  get isActive(): boolean {
    return [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN].includes(this.status);
  }
}