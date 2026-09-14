import { Router } from 'express';
import {
  createDelivery,
  getDeliveries,
  getDeliveryById,
  getParcelDetails,
  getDeliveryPartners,
  getNextOversizedRef
} from '../controllers/delivery.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createDeliverySchema, dateFilterSchema } from '../validators';
import { Role } from '@prisma/client';

const router = Router();

router.get('/partners', authenticate, getDeliveryPartners);
router.get('/next-oversized-ref', authenticate, getNextOversizedRef);
router.post('/', authenticate, authorize(Role.GUARD, Role.ADMIN), validate(createDeliverySchema), createDelivery);
router.get('/', authenticate, validate(dateFilterSchema), getDeliveries);
router.get('/parcels/:id', authenticate, getParcelDetails);
router.get('/:id', authenticate, getDeliveryById);

export default router;
