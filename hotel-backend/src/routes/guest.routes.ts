import { Router } from 'express';
import { GuestController } from '../controllers/guest.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
const guestController = new GuestController();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/', guestController.getAllGuests);
router.get('/search', guestController.searchGuests);
router.get('/:id', guestController.getGuestById);
router.get('/:id/history', guestController.getGuestHistory);
router.post('/', requireRole(['admin', 'manager', 'receptionist']), guestController.createGuest);
router.put('/:id', requireRole(['admin', 'manager', 'receptionist']), guestController.updateGuest);
router.delete('/:id', requireRole(['admin', 'manager']), guestController.deleteGuest);

export default router;