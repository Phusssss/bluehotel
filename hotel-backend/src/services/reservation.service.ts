import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Reservation, ReservationStatus } from '../entities/Reservation';
import { Guest } from '../entities/Guest';
import { Room, RoomStatus } from '../entities/Room';
import { AppError } from '../utils/errors';

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

  constructor() {
    this.reservationRepository = AppDataSource.getRepository(Reservation);
    this.guestRepository = AppDataSource.getRepository(Guest);
    this.roomRepository = AppDataSource.getRepository(Room);
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
      relations: ['guest', 'room', 'room.roomType', 'createdBy']
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
      status: ReservationStatus.CONFIRMED,
      source: reservationData.source as any
    });

    const savedReservation = await this.reservationRepository.save(reservation);

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

    return this.getReservationById(id);
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
      currentGuestId: null as any,
      checkOutTime: new Date(),
      lastUpdated: new Date(),
      updatedById: checkedOutById
    });

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
        currentGuestId: null as any,
        lastUpdated: new Date(),
        updatedById: cancelledById
      });
    }

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
}