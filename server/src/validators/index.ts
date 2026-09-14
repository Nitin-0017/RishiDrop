import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const searchStudentSchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
    limit: z.string().optional(),
  }),
});

export const createDeliverySchema = z.object({
  body: z.object({
    studentId: z.string().uuid('Valid Student ID is required'),
    deliveryPartnerId: z.string().uuid('Valid Delivery Partner ID is required'),
    storageType: z.enum(['RACK', 'OVERSIZED']).optional().default('RACK'),
    rackId: z.string().optional().nullable(),
    slotId: z.string().optional().nullable(),
    trackingNumber: z.string().optional().nullable(),
    notes: z.string().max(250).optional().nullable(),
  }).refine((data) => {
    if (data.storageType === 'RACK' || !data.storageType) {
      return !!data.slotId;
    }
    return true;
  }, {
    message: 'Storage slot is required for rack storage',
    path: ['slotId'],
  }),
});

export const generatePickupQrSchema = z.object({
  body: z.object({
    parcelId: z.string().min(1, 'Valid Parcel ID is required'),
  }),
});

export const generatePickupOtpSchema = z.object({
  body: z.object({
    parcelId: z.string().min(1, 'Valid Parcel ID is required'),
  }),
});

export const verifyQrSchema = z.object({
  body: z.object({
    token: z.string().min(3, 'Valid pickup token or QR data is required'),
    parcelId: z.string().optional(),
  }),
});

export const verifyParcelQrSchema = z.object({
  body: z.object({
    qrData: z.string().optional(),
    token: z.string().optional(),
  }).refine((data) => !!(data.qrData || data.token), {
    message: 'Either qrData or token is required',
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    parcelId: z.string().min(1).optional(),
    otpCode: z.string().min(1).optional(),
  }).refine((data) => !!(data.parcelId || data.otpCode), {
    message: 'Either otpCode or parcelId must be provided',
  }),
});

export const completeHandoverSchema = z.object({
  body: z.object({
    parcelId: z.string().min(1, 'Valid Parcel ID is required'),
    verificationMethod: z.enum(['QR', 'OTP', 'MANUAL_OVERRIDE']),
    verificationToken: z.string().optional().nullable(),
    otpCode: z.string().optional().nullable(),
    notes: z.string().max(300).optional().nullable(),
  }),
});

export const updateSlotStatusSchema = z.object({
  body: z.object({
    status: z.enum(['AVAILABLE', 'OCCUPIED', 'FULL', 'MAINTENANCE', 'ISSUE']),
  }),
});

export const dateFilterSchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.string().optional(),
    partnerId: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const guardProfileUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().min(10, 'Valid 10-digit phone number is required').optional(),
    email: z.string().email('Valid email address is required').optional(),
    profilePhoto: z.string().optional().nullable(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, 'Password must be at least 6 characters').optional(),
  }),
});

export const adminGuardCreateSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    badgeNumber: z.string().min(2, 'Guard ID is required'),
    phone: z.string().min(10, 'Phone number is required'),
    email: z.string().email('Valid email address is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    gateNumber: z.string().min(1, 'Gate assignment is required'),
    shift: z.string().min(1, 'Shift schedule is required'),
    profilePhoto: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const adminGuardUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    badgeNumber: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    gateNumber: z.string().optional(),
    shift: z.string().optional(),
    profilePhoto: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});
