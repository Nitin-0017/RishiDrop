import { Router } from 'express';
import { exportDeliveriesCsv, exportUnclaimedCsv, exportStorageCsv } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/deliveries/csv', authenticate, authorize(Role.ADMIN), exportDeliveriesCsv);
router.get('/unclaimed/csv', authenticate, authorize(Role.ADMIN), exportUnclaimedCsv);
router.get('/storage/csv', authenticate, authorize(Role.ADMIN), exportStorageCsv);

export default router;
