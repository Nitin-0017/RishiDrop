import { Router } from 'express';
import { getOverviewMetrics, getDetailedAnalytics, getForecast } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/overview', authenticate, getOverviewMetrics);
router.get('/detailed', authenticate, authorize(Role.ADMIN), getDetailedAnalytics);
router.get('/forecast', authenticate, authorize(Role.ADMIN), getForecast);

export default router;
