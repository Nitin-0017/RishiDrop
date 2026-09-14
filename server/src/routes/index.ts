import { Router } from 'express';
import authRoutes from './auth.routes';
import studentRoutes from './student.routes';
import deliveryRoutes from './delivery.routes';
import pickupRoutes from './pickup.routes';
import storageRoutes from './storage.routes';
import analyticsRoutes from './analytics.routes';
import reportRoutes from './report.routes';
import adminRoutes from './admin.routes';
import guardRoutes from './guard.routes';
import whatsappRoutes from './whatsapp.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/pickups', pickupRoutes);
router.use('/pickup', pickupRoutes);
router.use('/storage', storageRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/guards', guardRoutes);
router.use('/whatsapp', whatsappRoutes);

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CampusDrop Engine',
    version: '1.0.0',
  });
});

export default router;
