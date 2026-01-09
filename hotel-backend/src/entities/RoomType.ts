import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Room } from './Room';

@Entity('room_types')
export class RoomType {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'name_vi' })
  nameVi: string;

  @Column({ name: 'name_en', nullable: true })
  nameEn?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  capacity: number;

  @Column({ name: 'price_per_night', type: 'decimal', precision: 10, scale: 2 })
  pricePerNight: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Room, room => room.roomType)
  rooms: Room[];
}