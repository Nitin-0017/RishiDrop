import { Router } from 'express';
import {
  getGuardProfile,
  updateGuardProfile,
  getAllGuards,
  createGuard,
  updateGuard,
  deleteGuard,
  toggleGuardStatus
} from '../controllers/guard.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  guardProfileUpdateSchema,
  adminGuardCreateSchema,
  adminGuardUpdateSchema
} from '../validators';
import { Role } from '@prisma/client';

const router = Router();

// Guard self profile management
router.get('/profile', authenticate, getGuardProfile);
router.put('/profile', authenticate, validate(guardProfileUpdateSchema), updateGuardProfile);

// Admin Guard management
router.get('/', authenticate, authorize(Role.ADMIN), getAllGuards);
router.post('/', authenticate, authorize(Role.ADMIN), validate(adminGuardCreateSchema), createGuard);
router.put('/:id', authenticate, authorize(Role.ADMIN), validate(adminGuardUpdateSchema), updateGuard);
router.delete('/:id', authenticate, authorize(Role.ADMIN), deleteGuard);
router.patch('/:id/status', authenticate, authorize(Role.ADMIN), toggleGuardStatus);

export default router;
