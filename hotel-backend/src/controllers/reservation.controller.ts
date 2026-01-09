import { Request, Response } from 'express';
import { ReservationService } from '../services/reservation.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class ReservationController {
  private reservationService: ReservationService;

  constructor() {
    this.reservationService = new ReservationService();
  }

  getAllReservations = async (req: Request, res: Response): Promise<void> => {
    const filters = req.query;
    const reservations = await this.reservationService.getAllReservations(filters);
    
    res.json({
      success: true,
      data: reservations
    });
  };

  getReservationById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const reservation = await this.reservationService.getReservationById(parseInt(id));
    
    res.json({
      success: true,
      data: reservation
    });
  };

  createReservation = async (req: Request, res: Response): Promise<void> => {
    const reservationData = req.body;
    const userId = (req as AuthenticatedRequest).user?.userId;
    
    const reservation = await this.reservationService.createReservation(reservationData, userId);
    
    res.status(201).json({
      success: true,
      data: reservation
    });
  };

  updateReservation = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = (req as AuthenticatedRequest).user?.userId;
    
    const reservation = await this.reservationService.updateReservation(parseInt(id), updateData, userId);
    
    res.json({
      success: true,
      data: reservation
    });
  };

  checkIn = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user?.userId;
    
    const reservation = await this.reservationService.checkIn(parseInt(id), userId);
    
    res.json({
      success: true,
      data: reservation,
      message: 'Guest checked in successfully'
    });
  };

  checkOut = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = (req as AuthenticatedRequest).user?.userId;
    
    const reservation = await this.reservationService.checkOut(parseInt(id), userId);
    
    res.json({
      success: true,
      data: reservation,
      message: 'Guest checked out successfully'
    });
  };

  cancelReservation = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = (req as AuthenticatedRequest).user?.userId;
    
    const reservation = await this.reservationService.cancelReservation(parseInt(id), reason, userId);
    
    res.json({
      success: true,
      data: reservation,
      message: 'Reservation cancelled successfully'
    });
  };
}