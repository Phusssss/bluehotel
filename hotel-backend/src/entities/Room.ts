import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { RoomType } from './RoomType';
import { User } from './User';

export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  DIRTY = 'dirty',
  CLEANING = 'cleaning',
  MAINTENANCE = 'maintenance'
}

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'room_number', unique: true })
  roomNumber: string;

  @Column({ name: 'room_type_id' })
  roomTypeId: number;

  @Column({ nullable: true })
  floor?: number;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.AVAILABLE })
  status: RoomStatus;

  @Column({ name: 'current_guest_id', nullable: true })
  currentGuestId?: number;

  @Column({ name: 'check_out_time', nullable: true })
  checkOutTime?: Date;

  @Column({ name: 'housekeeping_notes', type: 'text', nullable: true })
  housekeepingNotes?: string;

  @Column({ name: 'last_updated', nullable: true })
  lastUpdated?: Date;

  @Column({ name: 'updated_by_id', nullable: true })
  updatedById?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => RoomType, roomType => roomType.rooms)
  @JoinColumn({ name: 'room_type_id' })
  roomType: RoomType;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by_id' })
  updatedBy?: User;
}