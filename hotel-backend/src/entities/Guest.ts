import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Reservation } from './Reservation';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export interface GuestPreferences {
  roomType?: string;
  floor?: number;
  bedType?: string;
  smokingPreference?: boolean;
  dietaryRestrictions?: string[];
  specialRequests?: string;
}

@Entity('guests')
export class Guest {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  nationality?: string;

  @Column({ name: 'passport_number', unique: true, nullable: true })
  passportNumber?: string;

  @Column({ name: 'date_of_birth', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender;

  @Column({ type: 'json', nullable: true })
  preferences?: GuestPreferences;

  @Column({ name: 'is_vip', default: false })
  isVip: boolean;

  @Column({ name: 'loyalty_points', default: 0 })
  loyaltyPoints: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Reservation, reservation => reservation.guest)
  reservations: Reservation[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get age(): number | null {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}