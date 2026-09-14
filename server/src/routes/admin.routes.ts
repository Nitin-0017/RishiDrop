import { Router } from 'express';
import { getGuards, getAuditLogs, triggerUnclaimedJob, getSystemSettings } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/guards', authenticate, authorize(Role.ADMIN), getGuards);
router.get('/audit-logs', authenticate, authorize(Role.ADMIN), getAuditLogs);
router.post('/jobs/trigger-unclaimed', authenticate, authorize(Role.ADMIN), triggerUnclaimedJob);
router.get('/settings', authenticate, authorize(Role.ADMIN), getSystemSettings);

export default router;
