import { Router } from 'express';
import authRoutes from './auth.routes';
import roomRoutes from './room.routes';
import guestRoutes from './guest.routes';
import reservationRoutes from './reservation.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Hotel Backend API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API version info
router.get('/version', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    api: 'Hotel Management System Backend',
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Room routes
router.use('/rooms', roomRoutes);

// Guest routes
router.use('/guests', guestRoutes);

// Reservation routes
router.use('/reservations', reservationRoutes);

// TODO: Add other route modules here
// router.use('/users', userRoutes);

export default router;