import { Request, Response } from 'express';
import { GuestService } from '../services/guest.service';

export class GuestController {
  private guestService: GuestService;

  constructor() {
    this.guestService = new GuestService();
  }

  getAllGuests = async (req: Request, res: Response): Promise<void> => {
    const guests = await this.guestService.getAllGuests();
    
    res.json({
      success: true,
      data: guests
    });
  };

  getGuestById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const guest = await this.guestService.getGuestById(parseInt(id));
    
    res.json({
      success: true,
      data: guest
    });
  };

  createGuest = async (req: Request, res: Response): Promise<void> => {
    const guestData = req.body;
    const guest = await this.guestService.createGuest(guestData);
    
    res.status(201).json({
      success: true,
      data: guest
    });
  };

  updateGuest = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const updateData = req.body;
    
    const guest = await this.guestService.updateGuest(parseInt(id), updateData);
    
    res.json({
      success: true,
      data: guest
    });
  };

  deleteGuest = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    await this.guestService.deleteGuest(parseInt(id));
    
    res.json({
      success: true,
      message: 'Guest deleted successfully'
    });
  };

  searchGuests = async (req: Request, res: Response): Promise<void> => {
    const { q } = req.query;
    const guests = await this.guestService.searchGuests(q as string);
    
    res.json({
      success: true,
      data: guests
    });
  };

  getGuestHistory = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const guest = await this.guestService.getGuestHistory(parseInt(id));
    
    res.json({
      success: true,
      data: guest
    });
  };
}