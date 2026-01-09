# 📅 STEP 4: RESERVATIONS & GUESTS (Weeks 7-9)

## I. OVERVIEW

**Duration**: 3 weeks  
**Team**: 2 Backend Developers + 1 Frontend Developer  
**Goal**: Implement complete reservation system with guest management and conflict detection

---

## II. TASKS CHECKLIST

### Week 7: Guest Management
- [ ] Create Guest entity and repository
- [ ] Implement guest CRUD operations
- [ ] Add guest search and filtering
- [ ] Create guest history tracking
- [ ] Add VIP classification logic
- [ ] Implement guest preferences

### Week 8: Reservation System
- [ ] Create Reservation entity and repository
- [ ] Implement reservation CRUD operations
- [ ] Add reservation status workflow
- [ ] Create check-in/check-out processes
- [ ] Implement booking reference system
- [ ] Add special requests handling

### Week 9: Conflict Detection & Audit
- [ ] Implement conflict detection algorithm
- [ ] Create audit log system
- [ ] Add reservation modification history
- [ ] Implement overbooking prevention
- [ ] Create reservation reports
- [ ] Write comprehensive tests

---

## III. DATABASE SCHEMA

### Guests Table
```sql
CREATE TABLE guests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  nationality VARCHAR(100),
  passport_number VARCHAR(50) UNIQUE,
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other'),
  preferences JSON,
  is_vip BOOLEAN DEFAULT FALSE,
  loyalty_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_is_vip (is_vip),
  INDEX idx_passport (passport_number)
);
```

### Reservations Table
```sql
CREATE TABLE reservations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  guest_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  number_of_guests INT NOT NULL,
  status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
  room_rate DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  special_requests TEXT,
  source ENUM('direct', 'booking.com', 'agoda', 'airbnb', 'phone', 'email') DEFAULT 'direct',
  booking_reference VARCHAR(50),
  created_by_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  
  FOREIGN KEY (guest_id) REFERENCES guests(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_check_in_date (check_in_date),
  INDEX idx_check_out_date (check_out_date),
  INDEX idx_guest_id (guest_id),
  INDEX idx_room_id (room_id),
  INDEX idx_source (source),
  INDEX idx_dates (check_in_date, check_out_date),
  INDEX idx_booking_reference (booking_reference)
);
```

### Reservation Audit Logs Table
```sql
CREATE TABLE reservation_audit_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  reservation_id BIGINT NOT NULL,
  action ENUM('create', 'update', 'delete', 'check_in', 'check_out', 'cancel') NOT NULL,
  changed_fields JSON,
  old_values JSON,
  new_values JSON,
  reason TEXT,
  changed_by_id BIGINT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by_id) REFERENCES users(id),
  INDEX idx_reservation_id (reservation_id),
  INDEX idx_action (action),
  INDEX idx_changed_at (changed_at)
);
```

---

## IV. IMPLEMENTATION

### 1. Guest Entity
```typescript
// src/entities/Guest.ts
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
```

### 2. Reservation Entity
```typescript
// src/entities/Reservation.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Guest } from './Guest';
import { Room } from './Room';
import { User } from './User';
import { ReservationAuditLog } from './ReservationAuditLog';

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

  @OneToMany(() => ReservationAuditLog, auditLog => auditLog.reservation)
  auditLogs: ReservationAuditLog[];

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
```

### 3. Reservation Service
```typescript
// src/services/reservation.service.ts
import { Repository, Between, Not, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Reservation, ReservationStatus } from '../entities/Reservation';
import { Guest } from '../entities/Guest';
import { Room, RoomStatus } from '../entities/Room';
import { ReservationAuditLog } from '../entities/ReservationAuditLog';
import { AppError } from '../utils/errors';
import { WebSocketService } from './websocket.service';

export interface CreateReservationRequest {
  guestId: number;
  roomId: number;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  specialRequests?: string;
  source?: string;
  bookingReference?: string;
}

export interface UpdateReservationRequest {
  roomId?: number;
  checkInDate?: Date;
  checkOutDate?: Date;
  numberOfGuests?: number;
  status?: ReservationStatus;
  specialRequests?: string;
}

export class ReservationService {
  private reservationRepository: Repository<Reservation>;
  private guestRepository: Repository<Guest>;
  private roomRepository: Repository<Room>;
  private auditLogRepository: Repository<ReservationAuditLog>;
  private websocketService: WebSocketService;

  constructor() {
    this.reservationRepository = AppDataSource.getRepository(Reservation);
    this.guestRepository = AppDataSource.getRepository(Guest);
    this.roomRepository = AppDataSource.getRepository(Room);
    this.auditLogRepository = AppDataSource.getRepository(ReservationAuditLog);
    this.websocketService = new WebSocketService();
  }

  async getAllReservations(filters?: any): Promise<Reservation[]> {
    const queryBuilder = this.reservationRepository.createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.guest', 'guest')
      .leftJoinAndSelect('reservation.room', 'room')
      .leftJoinAndSelect('room.roomType', 'roomType')
      .leftJoinAndSelect('reservation.createdBy', 'createdBy');

    // Apply filters
    if (filters?.status) {
      queryBuilder.andWhere('reservation.status = :status', { status: filters.status });
    }

    if (filters?.checkInDate) {
      queryBuilder.andWhere('reservation.checkInDate >= :checkInDate', { checkInDate: filters.checkInDate });
    }

    if (filters?.checkOutDate) {
      queryBuilder.andWhere('reservation.checkOutDate <= :checkOutDate', { checkOutDate: filters.checkOutDate });
    }

    if (filters?.guestId) {
      queryBuilder.andWhere('reservation.guestId = :guestId', { guestId: filters.guestId });
    }

    if (filters?.roomId) {
      queryBuilder.andWhere('reservation.roomId = :roomId', { roomId: filters.roomId });
    }

    return queryBuilder
      .orderBy('reservation.checkInDate', 'DESC')
      .getMany();
  }

  async getReservationById(id: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['guest', 'room', 'room.roomType', 'createdBy', 'auditLogs']
    });

    if (!reservation) {
      throw new AppError('Reservation not found', 404);
    }

    return reservation;
  }

  async createReservation(reservationData: CreateReservationRequest, createdById?: number): Promise<Reservation> {
    // Validate guest exists
    const guest = await this.guestRepository.findOne({
      where: { id: reservationData.guestId }
    });

    if (!guest) {
      throw new AppError('Guest not found', 404);
    }

    // Validate room exists
    const room = await this.roomRepository.findOne({
      where: { id: reservationData.roomId },
      relations: ['roomType']
    });

    if (!room) {
      throw new AppError('Room not found', 404);
    }

    // Check room capacity
    if (reservationData.numberOfGuests > room.roomType.capacity) {
      throw new AppError('Number of guests exceeds room capacity', 400);
    }

    // Check for conflicts
    const hasConflict = await this.checkReservationConflict(
      reservationData.roomId,
      reservationData.checkInDate,
      reservationData.checkOutDate
    );

    if (hasConflict) {
      throw new AppError('Room is not available for the selected dates', 400);
    }

    // Calculate total price
    const numberOfNights = this.calculateNumberOfNights(reservationData.checkInDate, reservationData.checkOutDate);
    const totalPrice = numberOfNights * room.roomType.pricePerNight;

    // Generate booking reference
    const bookingReference = reservationData.bookingReference || this.generateBookingReference();

    // Create reservation
    const reservation = this.reservationRepository.create({
      ...reservationData,
      roomRate: room.roomType.pricePerNight,
      totalPrice,
      bookingReference,
      createdById,
      status: ReservationStatus.CONFIRMED
    });

    const savedReservation = await this.reservationRepository.save(reservation);

    // Create audit log
    await this.createAuditLog(savedReservation.id, 'create', {}, savedReservation, createdById);

    // Emit real-time update
    this.websocketService.emitReservationCreated(await this.getReservationById(savedReservation.id));

    return this.getReservationById(savedReservation.id);
  }

  async updateReservation(id: number, updateData: UpdateReservationRequest, updatedById?: number): Promise<Reservation> {
    const existingReservation = await this.getReservationById(id);

    // If room or dates are being changed, check for conflicts
    if (updateData.roomId || updateData.checkInDate || updateData.checkOutDate) {
      const roomId = updateData.roomId || existingReservation.roomId;
      const checkInDate = updateData.checkInDate || existingReservation.checkInDate;
      const checkOutDate = updateData.checkOutDate || existingReservation.checkOutDate;

      const hasConflict = await this.checkReservationConflict(roomId, checkInDate, checkOutDate, id);

      if (hasConflict) {
        throw new AppError('Room is not available for the selected dates', 400);
      }
    }

    // Recalculate total price if room or dates changed
    let totalPrice = existingReservation.totalPrice;
    if (updateData.roomId || updateData.checkInDate || updateData.checkOutDate) {
      const room = await this.roomRepository.findOne({
        where: { id: updateData.roomId || existingReservation.roomId },
        relations: ['roomType']
      });

      const checkInDate = updateData.checkInDate || existingReservation.checkInDate;
      const checkOutDate = updateData.checkOutDate || existingReservation.checkOutDate;
      const numberOfNights = this.calculateNumberOfNights(checkInDate, checkOutDate);
      
      totalPrice = numberOfNights * room!.roomType.pricePerNight;
    }

    // Update reservation
    await this.reservationRepository.update(id, {
      ...updateData,
      totalPrice
    });

    // Create audit log
    await this.createAuditLog(id, 'update', existingReservation, updateData, updatedById);

    const updatedReservation = await this.getReservationById(id);

    // Emit real-time update
    this.websocketService.emitReservationUpdated(updatedReservation);

    return updatedReservation;
  }

  async checkIn(id: number, checkedInById?: number): Promise<Reservation> {
    const reservation = await this.getReservationById(id);

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new AppError('Only confirmed reservations can be checked in', 400);
    }

    // Update reservation status
    await this.reservationRepository.update(id, {
      status: ReservationStatus.CHECKED_IN
    });

    // Update room status
    await this.roomRepository.update(reservation.roomId, {
      status: RoomStatus.OCCUPIED,
      currentGuestId: reservation.guestId,
      lastUpdated: new Date(),
      updatedById: checkedInById
    });

    // Create audit log
    await this.createAuditLog(id, 'check_in', { status: reservation.status }, { status: ReservationStatus.CHECKED_IN }, checkedInById);

    return this.getReservationById(id);
  }

  async checkOut(id: number, checkedOutById?: number): Promise<Reservation> {
    const reservation = await this.getReservationById(id);

    if (reservation.status !== ReservationStatus.CHECKED_IN) {
      throw new AppError('Only checked-in reservations can be checked out', 400);
    }

    // Update reservation status
    await this.reservationRepository.update(id, {
      status: ReservationStatus.CHECKED_OUT
    });

    // Update room status
    await this.roomRepository.update(reservation.roomId, {
      status: RoomStatus.DIRTY,
      currentGuestId: null,
      checkOutTime: new Date(),
      lastUpdated: new Date(),
      updatedById: checkedOutById
    });

    // Create audit log
    await this.createAuditLog(id, 'check_out', { status: reservation.status }, { status: ReservationStatus.CHECKED_OUT }, checkedOutById);

    return this.getReservationById(id);
  }

  async cancelReservation(id: number, reason?: string, cancelledById?: number): Promise<Reservation> {
    const reservation = await this.getReservationById(id);

    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new AppError('Reservation is already cancelled', 400);
    }

    // Update reservation status
    await this.reservationRepository.update(id, {
      status: ReservationStatus.CANCELLED
    });

    // If room was occupied, update room status
    if (reservation.status === ReservationStatus.CHECKED_IN) {
      await this.roomRepository.update(reservation.roomId, {
        status: RoomStatus.DIRTY,
        currentGuestId: null,
        lastUpdated: new Date(),
        updatedById: cancelledById
      });
    }

    // Create audit log
    await this.createAuditLog(id, 'cancel', { status: reservation.status }, { status: ReservationStatus.CANCELLED }, cancelledById, reason);

    return this.getReservationById(id);
  }

  private async checkReservationConflict(roomId: number, checkInDate: Date, checkOutDate: Date, excludeReservationId?: number): Promise<boolean> {
    const queryBuilder = this.reservationRepository.createQueryBuilder('reservation')
      .where('reservation.roomId = :roomId', { roomId })
      .andWhere('reservation.status IN (:...statuses)', { 
        statuses: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN] 
      })
      .andWhere('NOT (reservation.checkOutDate <= :checkInDate OR reservation.checkInDate >= :checkOutDate)', {
        checkInDate,
        checkOutDate
      });

    if (excludeReservationId) {
      queryBuilder.andWhere('reservation.id != :excludeReservationId', { excludeReservationId });
    }

    const conflictingReservations = await queryBuilder.getMany();
    return conflictingReservations.length > 0;
  }

  private calculateNumberOfNights(checkInDate: Date, checkOutDate: Date): number {
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  private generateBookingReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `HTL-${timestamp}-${random}`.toUpperCase();
  }

  private async createAuditLog(reservationId: number, action: string, oldValues: any, newValues: any, changedById?: number, reason?: string): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      reservationId,
      action,
      oldValues,
      newValues,
      changedById,
      reason
    });

    await this.auditLogRepository.save(auditLog);
  }
}
```

---

## V. API ENDPOINTS

### Reservation Routes
```typescript
// src/routes/reservation.routes.ts
import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware';

const router = Router();
const reservationController = new ReservationController();

router.use(authMiddleware);

router.get('/', reservationController.getAllReservations);
router.get('/:id', reservationController.getReservationById);
router.get('/:id/audit', requirePermission('read:audit'), reservationController.getAuditLogs);
router.post('/', requirePermission('create:reservation'), reservationController.createReservation);
router.put('/:id', requirePermission('update:reservation'), reservationController.updateReservation);
router.post('/:id/check-in', requirePermission('checkin:reservation'), reservationController.checkIn);
router.post('/:id/check-out', requirePermission('checkout:reservation'), reservationController.checkOut);
router.post('/:id/cancel', requirePermission('cancel:reservation'), reservationController.cancelReservation);
router.delete('/:id', requirePermission('delete:reservation'), reservationController.deleteReservation);

export default router;
```

### API Documentation
```
GET    /api/reservations               - Get all reservations
GET    /api/reservations/:id           - Get reservation by ID
GET    /api/reservations/:id/audit     - Get audit logs
POST   /api/reservations               - Create reservation
PUT    /api/reservations/:id           - Update reservation
POST   /api/reservations/:id/check-in  - Check-in guest
POST   /api/reservations/:id/check-out - Check-out guest
POST   /api/reservations/:id/cancel    - Cancel reservation
DELETE /api/reservations/:id           - Delete reservation
```

---

## VI. SUCCESS CRITERIA

- [ ] Reservation CRUD operations working
- [ ] Conflict detection preventing overbooking
- [ ] Check-in/check-out processes functional
- [ ] Audit logging all changes
- [ ] Guest management complete
- [ ] Real-time updates working
- [ ] All tests passing (>80% coverage)
- [ ] API documentation complete

---

## VII. NEXT STEPS

After completing this step:
1. Move to **STEP 5: Invoices & Payments**
2. Implement billing system
3. Add payment processing
4. Create invoice generation