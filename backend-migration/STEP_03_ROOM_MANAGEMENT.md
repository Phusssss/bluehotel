# 🏨 STEP 3: ROOM MANAGEMENT APIs (Weeks 5-6)

## I. OVERVIEW

**Duration**: 2 weeks  
**Team**: 1 Backend Developer + 1 Frontend Developer  
**Goal**: Implement complete room management system with real-time updates

---

## II. TASKS CHECKLIST

### Week 5: Room Entities & CRUD
- [ ] Create Room Type entity and repository
- [ ] Create Room entity and repository
- [ ] Create Amenities entity and repository
- [ ] Implement room CRUD operations
- [ ] Add room availability checking
- [ ] Create room type management

### Week 6: Real-time & Integration
- [ ] Implement real-time room status updates
- [ ] Add WebSocket/SSE for live updates
- [ ] Create housekeeping integration API
- [ ] Add room search and filtering
- [ ] Implement room assignment logic
- [ ] Write comprehensive tests

---

## III. DATABASE SCHEMA

### Room Types Table
```sql
CREATE TABLE room_types (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name_vi VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description TEXT,
  capacity INT NOT NULL,
  price_per_night DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_capacity (capacity),
  INDEX idx_is_active (is_active)
);
```

### Rooms Table
```sql
CREATE TABLE rooms (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_number VARCHAR(20) UNIQUE NOT NULL,
  room_type_id BIGINT NOT NULL,
  floor INT,
  status ENUM('available', 'occupied', 'dirty', 'cleaning', 'maintenance') DEFAULT 'available',
  current_guest_id BIGINT,
  check_out_time DATETIME,
  housekeeping_notes TEXT,
  last_updated DATETIME,
  updated_by_id BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (room_type_id) REFERENCES room_types(id),
  FOREIGN KEY (updated_by_id) REFERENCES users(id),
  INDEX idx_room_number (room_number),
  INDEX idx_status (status),
  INDEX idx_floor (floor),
  INDEX idx_current_guest_id (current_guest_id)
);
```

### Amenities Table
```sql
CREATE TABLE amenities (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name_vi VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  icon_url VARCHAR(500),
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category (category)
);

CREATE TABLE room_type_amenities (
  room_type_id BIGINT NOT NULL,
  amenity_id BIGINT NOT NULL,
  PRIMARY KEY (room_type_id, amenity_id),
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
);
```

---

## IV. IMPLEMENTATION

### 1. Room Type Entity
```typescript
// src/entities/RoomType.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Room } from './Room';
import { Amenity } from './Amenity';

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

  @ManyToMany(() => Amenity, amenity => amenity.roomTypes)
  @JoinTable({
    name: 'room_type_amenities',
    joinColumn: { name: 'room_type_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'amenity_id', referencedColumnName: 'id' }
  })
  amenities: Amenity[];
}
```

### 2. Room Entity
```typescript
// src/entities/Room.ts
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
```

### 3. Room Service
```typescript
// src/services/room.service.ts
import { Repository, FindManyOptions } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Room, RoomStatus } from '../entities/Room';
import { RoomType } from '../entities/RoomType';
import { AppError } from '../utils/errors';
import { WebSocketService } from './websocket.service';

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

export interface RoomAvailabilityQuery {
  checkIn: Date;
  checkOut: Date;
  capacity?: number;
  roomTypeId?: number;
}

export class RoomService {
  private roomRepository: Repository<Room>;
  private roomTypeRepository: Repository<RoomType>;
  private websocketService: WebSocketService;

  constructor() {
    this.roomRepository = AppDataSource.getRepository(Room);
    this.roomTypeRepository = AppDataSource.getRepository(RoomType);
    this.websocketService = new WebSocketService();
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

    const updatedRoom = await this.getRoomById(id);

    // Emit real-time update if status changed
    if (updateData.status && updateData.status !== room.status) {
      this.websocketService.emitRoomStatusUpdate(updatedRoom);
    }

    return updatedRoom;
  }

  async updateRoomStatus(id: number, status: RoomStatus, updatedById?: number, notes?: string): Promise<Room> {
    return this.updateRoom(id, {
      status,
      housekeepingNotes: notes,
      lastUpdated: new Date()
    }, updatedById);
  }

  async deleteRoom(id: number): Promise<void> {
    const room = await this.getRoomById(id);

    // Check if room has active reservations
    // This would require reservation entity, so we'll add this check later

    await this.roomRepository.delete(id);
  }

  async getAvailableRooms(query: RoomAvailabilityQuery): Promise<Room[]> {
    const queryBuilder = this.roomRepository.createQueryBuilder('room')
      .leftJoinAndSelect('room.roomType', 'roomType')
      .where('room.status = :status', { status: RoomStatus.AVAILABLE });

    // Filter by capacity if specified
    if (query.capacity) {
      queryBuilder.andWhere('roomType.capacity >= :capacity', { capacity: query.capacity });
    }

    // Filter by room type if specified
    if (query.roomTypeId) {
      queryBuilder.andWhere('room.roomTypeId = :roomTypeId', { roomTypeId: query.roomTypeId });
    }

    // Check for conflicting reservations (this would require reservation entity)
    // We'll implement this in the next step

    return queryBuilder.getMany();
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
```

### 4. Room Controller
```typescript
// src/controllers/room.controller.ts
import { Request, Response } from 'express';
import { RoomService } from '../services/room.service';
import { RoomStatus } from '../entities/Room';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class RoomController {
  private roomService: RoomService;

  constructor() {
    this.roomService = new RoomService();
  }

  getAllRooms = async (req: Request, res: Response): Promise<void> => {
    const { status, floor, roomTypeId } = req.query;
    
    const options: any = {};
    if (status) options.where = { ...options.where, status };
    if (floor) options.where = { ...options.where, floor: parseInt(floor as string) };
    if (roomTypeId) options.where = { ...options.where, roomTypeId: parseInt(roomTypeId as string) };

    const rooms = await this.roomService.getAllRooms(options);
    
    res.json({
      success: true,
      data: rooms
    });
  };

  getRoomById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const room = await this.roomService.getRoomById(parseInt(id));
    
    res.json({
      success: true,
      data: room
    });
  };

  createRoom = async (req: Request, res: Response): Promise<void> => {
    const roomData = req.body;
    const room = await this.roomService.createRoom(roomData);
    
    res.status(201).json({
      success: true,
      data: room
    });
  };

  updateRoom = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;
    
    const room = await this.roomService.updateRoom(parseInt(id), updateData, userId);
    
    res.json({
      success: true,
      data: room
    });
  };

  updateRoomStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = (req as AuthenticatedRequest).user.userId;
    
    const room = await this.roomService.updateRoomStatus(
      parseInt(id), 
      status as RoomStatus, 
      userId, 
      notes
    );
    
    res.json({
      success: true,
      data: room
    });
  };

  deleteRoom = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await this.roomService.deleteRoom(parseInt(id));
    
    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  };

  getAvailableRooms = async (req: Request, res: Response): Promise<void> => {
    const { checkIn, checkOut, capacity, roomTypeId } = req.query;
    
    const query = {
      checkIn: new Date(checkIn as string),
      checkOut: new Date(checkOut as string),
      capacity: capacity ? parseInt(capacity as string) : undefined,
      roomTypeId: roomTypeId ? parseInt(roomTypeId as string) : undefined
    };
    
    const rooms = await this.roomService.getAvailableRooms(query);
    
    res.json({
      success: true,
      data: rooms
    });
  };

  searchRooms = async (req: Request, res: Response): Promise<void> => {
    const { q } = req.query;
    const rooms = await this.roomService.searchRooms(q as string);
    
    res.json({
      success: true,
      data: rooms
    });
  };
}
```

### 5. WebSocket Service for Real-time Updates
```typescript
// src/services/websocket.service.ts
import { Server as SocketIOServer } from 'socket.io';
import { Room } from '../entities/Room';
import { logger } from '../config/logger';

export class WebSocketService {
  private io?: SocketIOServer;

  setSocketServer(io: SocketIOServer): void {
    this.io = io;
  }

  emitRoomStatusUpdate(room: Room): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized');
      return;
    }

    this.io.emit('room:status-changed', {
      roomId: room.id,
      roomNumber: room.roomNumber,
      status: room.status,
      timestamp: new Date().toISOString(),
      updatedBy: room.updatedBy?.fullName
    });

    logger.info(`Room status update emitted for room ${room.roomNumber}: ${room.status}`);
  }

  emitRoomUpdate(room: Room): void {
    if (!this.io) {
      logger.warn('WebSocket server not initialized');
      return;
    }

    this.io.emit('room:updated', {
      room,
      timestamp: new Date().toISOString()
    });
  }
}
```

---

## V. API ENDPOINTS

### Room Routes
```typescript
// src/routes/room.routes.ts
import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { authMiddleware, requirePermission } from '../middleware/auth.middleware';

const router = Router();
const roomController = new RoomController();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/', roomController.getAllRooms);
router.get('/search', roomController.searchRooms);
router.get('/available', roomController.getAvailableRooms);
router.get('/:id', roomController.getRoomById);
router.post('/', requirePermission('create:room'), roomController.createRoom);
router.put('/:id', requirePermission('update:room'), roomController.updateRoom);
router.put('/:id/status', requirePermission('update:room'), roomController.updateRoomStatus);
router.delete('/:id', requirePermission('delete:room'), roomController.deleteRoom);

export default router;
```

### API Documentation
```
GET    /api/rooms                      - Get all rooms
GET    /api/rooms/search?q=term        - Search rooms
GET    /api/rooms/available            - Get available rooms
GET    /api/rooms/:id                  - Get room by ID
POST   /api/rooms                      - Create new room
PUT    /api/rooms/:id                  - Update room
PUT    /api/rooms/:id/status           - Update room status
DELETE /api/rooms/:id                  - Delete room
```

---

## VI. TESTING

### Unit Tests
```typescript
// tests/services/room.service.test.ts
import { RoomService } from '../../src/services/room.service';
import { RoomStatus } from '../../src/entities/Room';

describe('RoomService', () => {
  let roomService: RoomService;

  beforeEach(() => {
    roomService = new RoomService();
  });

  describe('createRoom', () => {
    it('should create room successfully', async () => {
      const roomData = {
        roomNumber: '101',
        roomTypeId: 1,
        floor: 1
      };

      const room = await roomService.createRoom(roomData);

      expect(room.roomNumber).toBe(roomData.roomNumber);
      expect(room.roomTypeId).toBe(roomData.roomTypeId);
      expect(room.status).toBe(RoomStatus.AVAILABLE);
    });

    it('should throw error for duplicate room number', async () => {
      const roomData = {
        roomNumber: '101',
        roomTypeId: 1,
        floor: 1
      };

      await roomService.createRoom(roomData);

      await expect(roomService.createRoom(roomData))
        .rejects.toThrow('Room number already exists');
    });
  });

  describe('updateRoomStatus', () => {
    it('should update room status successfully', async () => {
      const room = await roomService.updateRoomStatus(1, RoomStatus.CLEANING, 1);

      expect(room.status).toBe(RoomStatus.CLEANING);
      expect(room.lastUpdated).toBeDefined();
    });
  });
});
```

---

## VII. SUCCESS CRITERIA

- [ ] Room CRUD operations working
- [ ] Real-time status updates functional
- [ ] Room availability checking implemented
- [ ] WebSocket integration working
- [ ] Room search and filtering working
- [ ] Housekeeping integration ready
- [ ] All tests passing (>80% coverage)
- [ ] API documentation complete

---

## VIII. NEXT STEPS

After completing this step:
1. Move to **STEP 4: Reservations & Guests**
2. Implement reservation system
3. Add conflict detection
4. Create guest management