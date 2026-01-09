import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Guest } from '../entities/Guest';
import { AppError } from '../utils/errors';

export interface CreateGuestRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationality?: string;
  passportNumber?: string;
  dateOfBirth?: Date;
  gender?: string;
  preferences?: any;
}

export interface UpdateGuestRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  passportNumber?: string;
  dateOfBirth?: Date;
  gender?: string;
  preferences?: any;
  isVip?: boolean;
  loyaltyPoints?: number;
}

export class GuestService {
  private guestRepository: Repository<Guest>;

  constructor() {
    this.guestRepository = AppDataSource.getRepository(Guest);
  }

  async getAllGuests(): Promise<Guest[]> {
    return this.guestRepository.find({
      relations: ['reservations'],
      order: { createdAt: 'DESC' }
    });
  }

  async getGuestById(id: number): Promise<Guest> {
    const guest = await this.guestRepository.findOne({
      where: { id },
      relations: ['reservations', 'reservations.room', 'reservations.room.roomType']
    });

    if (!guest) {
      throw new AppError('Guest not found', 404);
    }

    return guest;
  }

  async createGuest(guestData: CreateGuestRequest): Promise<Guest> {
    // Check if passport number already exists
    if (guestData.passportNumber) {
      const existingGuest = await this.guestRepository.findOne({
        where: { passportNumber: guestData.passportNumber }
      });

      if (existingGuest) {
        throw new AppError('Passport number already exists', 400);
      }
    }

    const guest = this.guestRepository.create({
      ...guestData,
      gender: guestData.gender as any
    });
    const savedGuest = await this.guestRepository.save(guest);

    return this.getGuestById(savedGuest.id);
  }

  async updateGuest(id: number, updateData: UpdateGuestRequest): Promise<Guest> {
    const guest = await this.getGuestById(id);

    // If passport number is being updated, check for duplicates
    if (updateData.passportNumber && updateData.passportNumber !== guest.passportNumber) {
      const existingGuest = await this.guestRepository.findOne({
        where: { passportNumber: updateData.passportNumber }
      });

      if (existingGuest) {
        throw new AppError('Passport number already exists', 400);
      }
    }

    await this.guestRepository.update(id, {
      ...updateData,
      gender: updateData.gender as any
    });
    return this.getGuestById(id);
  }

  async deleteGuest(id: number): Promise<void> {
    const guest = await this.getGuestById(id);
    await this.guestRepository.delete(id);
  }

  async searchGuests(searchTerm: string): Promise<Guest[]> {
    return this.guestRepository.createQueryBuilder('guest')
      .where('guest.firstName LIKE :search', { search: `%${searchTerm}%` })
      .orWhere('guest.lastName LIKE :search', { search: `%${searchTerm}%` })
      .orWhere('guest.email LIKE :search', { search: `%${searchTerm}%` })
      .orWhere('guest.phone LIKE :search', { search: `%${searchTerm}%` })
      .orWhere('guest.passportNumber LIKE :search', { search: `%${searchTerm}%` })
      .orderBy('guest.firstName', 'ASC')
      .getMany();
  }

  async getGuestHistory(id: number): Promise<Guest> {
    const guest = await this.guestRepository.findOne({
      where: { id },
      relations: [
        'reservations', 
        'reservations.room', 
        'reservations.room.roomType'
      ]
    });

    if (!guest) {
      throw new AppError('Guest not found', 404);
    }

    return guest;
  }
}