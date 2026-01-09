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
    const userId = (req as AuthenticatedRequest).user?.userId;
    
    const room = await this.roomService.updateRoom(parseInt(id), updateData, userId);
    
    res.json({
      success: true,
      data: room
    });
  };

  updateRoomStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = (req as AuthenticatedRequest).user?.userId;
    
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

  searchRooms = async (req: Request, res: Response): Promise<void> => {
    const { q } = req.query;
    const rooms = await this.roomService.searchRooms(q as string);
    
    res.json({
      success: true,
      data: rooms
    });
  };
}