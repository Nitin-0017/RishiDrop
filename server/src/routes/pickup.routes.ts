import { Router } from 'express';
import {
  generateQr,
  generateOtp,
  verifyQr,
  verifyParcelQr,
  verifyOtp,
  completeHandover,
  listPickups
} from '../controllers/pickup.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  generatePickupQrSchema,
  generatePickupOtpSchema,
  verifyQrSchema,
  verifyParcelQrSchema,
  verifyOtpSchema,
  completeHandoverSchema
} from '../validators';
import { Role } from '@prisma/client';

const router = Router();

// Student routes to generate QR / OTP pass
router.post('/qr', authenticate, validate(generatePickupQrSchema), generateQr);
router.post('/otp', authenticate, validate(generatePickupOtpSchema), generateOtp);

// Guard routes to verify QR / OTP pass & complete handover
router.post('/verify-qr', authenticate, authorize(Role.GUARD, Role.ADMIN), validate(verifyQrSchema), verifyQr);
router.post('/verify-parcel-qr', authenticate, authorize(Role.GUARD, Role.ADMIN), validate(verifyParcelQrSchema), verifyParcelQr);
router.post('/verify-otp', authenticate, authorize(Role.GUARD, Role.ADMIN), validate(verifyOtpSchema), verifyOtp);
router.post('/complete', authenticate, authorize(Role.GUARD, Role.ADMIN), validate(completeHandoverSchema), completeHandover);

// Admin & Guard route to view pickup ledger
router.get('/', authenticate, authorize(Role.GUARD, Role.ADMIN), listPickups);

export default router;
