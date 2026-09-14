import { Router } from 'express';
import {
  getStorageOverview,
  createRack,
  updateRack,
  deleteRack,
  createSlot,
  updateSlot,
  deleteSlot
} from '../controllers/storage.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Storage Overview (Guard & Admin)
router.get('/', authenticate, getStorageOverview);

// Rack Management (Admin)
router.post('/racks', authenticate, authorize(Role.ADMIN), createRack);
router.put('/racks/:id', authenticate, authorize(Role.ADMIN), updateRack);
router.delete('/racks/:id', authenticate, authorize(Role.ADMIN), deleteRack);

// Slot Management (Admin & Guard status change)
router.post('/slots', authenticate, authorize(Role.ADMIN), createSlot);
router.put('/slots/:id', authenticate, authorize(Role.ADMIN, Role.GUARD), updateSlot);
router.delete('/slots/:id', authenticate, authorize(Role.ADMIN), deleteSlot);

export default router;
