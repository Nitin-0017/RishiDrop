import { Router } from 'express';
import { webhookGet, webhookPost, simulateIncoming, getWhatsAppMessageLog, getResolvedAccount } from '../controllers/whatsapp.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Meta Webhook Verification & Events
router.get('/webhook', webhookGet);
router.post('/webhook', webhookPost);

// Dev / Interactive Simulator Endpoints
router.post('/simulate', simulateIncoming);
router.get('/account', getResolvedAccount);
router.get('/messages', authenticate, getWhatsAppMessageLog);

export default router;
