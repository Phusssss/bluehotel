import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
const reservationController = new ReservationController();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/', reservationController.getAllReservations);
router.get('/:id', reservationController.getReservationById);
router.post('/', requireRole(['admin', 'manager', 'receptionist']), reservationController.createReservation);
router.put('/:id', requireRole(['admin', 'manager', 'receptionist']), reservationController.updateReservation);
router.post('/:id/check-in', requireRole(['admin', 'manager', 'receptionist']), reservationController.checkIn);
router.post('/:id/check-out', requireRole(['admin', 'manager', 'receptionist']), reservationController.checkOut);
router.post('/:id/cancel', requireRole(['admin', 'manager', 'receptionist']), reservationController.cancelReservation);

export default router;