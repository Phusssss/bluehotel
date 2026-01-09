import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';

const router = Router();
const roomController = new RoomController();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/', roomController.getAllRooms);
router.get('/search', roomController.searchRooms);
router.get('/:id', roomController.getRoomById);
router.post('/', requireRole(['admin', 'manager']), roomController.createRoom);
router.put('/:id', requireRole(['admin', 'manager', 'receptionist']), roomController.updateRoom);
router.put('/:id/status', requireRole(['admin', 'manager', 'receptionist', 'housekeeper']), roomController.updateRoomStatus);
router.delete('/:id', requireRole(['admin', 'manager']), roomController.deleteRoom);

export default router;