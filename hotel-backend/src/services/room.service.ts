import { Repository, FindManyOptions } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Room, RoomStatus } from '../entities/Room';
import { RoomType } from '../entities/RoomType';
import { AppError } from '../utils/errors';

export interface CreateRoomRequest {
  roomNumber: string;
  roomTypeId: number;
  floor?: number;
}

export interface UpdateRoomRequest {
  roomNumber?: string;
  roomTypeId?: number;
  floor?: number;
  status?: RoomStatus;
  housekeepingNotes?: string;
}

export class RoomService {
  private roomRepository: Repository<Room>;
  private roomTypeRepository: Repository<RoomType>;

  constructor() {
    this.roomRepository = AppDataSource.getRepository(Room);
    this.roomTypeRepository = AppDataSource.getRepository(RoomType);
  }

  async getAllRooms(options?: FindManyOptions<Room>): Promise<Room[]> {
    return this.roomRepository.find({
      relations: ['roomType', 'updatedBy'],
      order: { roomNumber: 'ASC' },
      ...options
    });
  }

  async getRoomById(id: number): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['roomType', 'updatedBy']
    });

    if (!room) {
      throw new AppError('Room not found', 404);
    }

    return room;
  }

  async createRoom(roomData: CreateRoomRequest): Promise<Room> {
    // Check if room number already exists
    const existingRoom = await this.roomRepository.findOne({
      where: { roomNumber: roomData.roomNumber }
    });

    if (existingRoom) {
      throw new AppError('Room number already exists', 400);
    }

    // Verify room type exists
    const roomType = await this.roomTypeRepository.findOne({
      where: { id: roomData.roomTypeId }
    });

    if (!roomType) {
      throw new AppError('Room type not found', 404);
    }

    const room = this.roomRepository.create(roomData);
    const savedRoom = await this.roomRepository.save(room);

    return this.getRoomById(savedRoom.id);
  }

  async updateRoom(id: number, updateData: UpdateRoomRequest, updatedById?: number): Promise<Room> {
    const room = await this.getRoomById(id);

    // If room number is being updated, check for duplicates
    if (updateData.roomNumber && updateData.roomNumber !== room.roomNumber) {
      const existingRoom = await this.roomRepository.findOne({
        where: { roomNumber: updateData.roomNumber }
      });

      if (existingRoom) {
        throw new AppError('Room number already exists', 400);
      }
    }

    // If room type is being updated, verify it exists
    if (updateData.roomTypeId) {
      const roomType = await this.roomTypeRepository.findOne({
        where: { id: updateData.roomTypeId }
      });

      if (!roomType) {
        throw new AppError('Room type not found', 404);
      }
    }

    // Update room
    await this.roomRepository.update(id, {
      ...updateData,
      lastUpdated: new Date(),
      updatedById
    });

    return this.getRoomById(id);
  }

  async updateRoomStatus(id: number, status: RoomStatus, updatedById?: number, notes?: string): Promise<Room> {
    await this.roomRepository.update(id, {
      status,
      housekeepingNotes: notes,
      lastUpdated: new Date(),
      updatedById
    });

    return this.getRoomById(id);
  }

  async deleteRoom(id: number): Promise<void> {
    const room = await this.getRoomById(id);
    await this.roomRepository.delete(id);
  }

  async getRoomsByStatus(status: RoomStatus): Promise<Room[]> {
    return this.roomRepository.find({
      where: { status },
      relations: ['roomType', 'updatedBy'],
      order: { roomNumber: 'ASC' }
    });
  }

  async getRoomsByFloor(floor: number): Promise<Room[]> {
    return this.roomRepository.find({
      where: { floor },
      relations: ['roomType', 'updatedBy'],
      order: { roomNumber: 'ASC' }
    });
  }

  async searchRooms(searchTerm: string): Promise<Room[]> {
    return this.roomRepository.createQueryBuilder('room')
      .leftJoinAndSelect('room.roomType', 'roomType')
      .where('room.roomNumber LIKE :search', { search: `%${searchTerm}%` })
      .orWhere('roomType.nameVi LIKE :search', { search: `%${searchTerm}%` })
      .orWhere('roomType.nameEn LIKE :search', { search: `%${searchTerm}%` })
      .orderBy('room.roomNumber', 'ASC')
      .getMany();
  }
}