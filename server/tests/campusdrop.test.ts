import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config';

describe('CampusDrop End-to-End API Test Suite', () => {
  let adminToken: string;
  let guardToken: string;
  let studentToken: string;
  let sampleStudentId: string;
  let samplePartnerId: string;
  let sampleSlotId: string;
  let sampleRackId: string;
  let testParcelId: string;
  let activeParcelDbId: string;
  let secondParcelDbId: string;

  const cleanupTestData = async () => {
    try {
      // 1. Clean up test guard created in Admin Guard Management
      const testGuardUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'karansingh@campusdrop.demo' },
            { phone: '9876599999' }
          ]
        },
        include: { guard: true }
      });
      if (testGuardUser) {
        if (testGuardUser.guard) {
          await prisma.guard.delete({ where: { id: testGuardUser.guard.id } });
        }
        await prisma.user.delete({ where: { id: testGuardUser.id } });
      } else {
        await prisma.guard.deleteMany({ where: { badgeNumber: 'GD-099' } });
      }

      // 2. Clean up test parcels and deliveries created during test run
      const testParcels = await prisma.parcel.findMany({
        where: {
          trackingNumber: { startsWith: 'TRK-TEST' }
        }
      });
      const parcelIds = testParcels.map((p) => p.id);
      const slotIdsToUpdate = Array.from(
        new Set(testParcels.map((p) => p.storageSlotId).filter(Boolean))
      ) as string[];

      if (parcelIds.length > 0) {
        await prisma.pickup.deleteMany({ where: { parcelId: { in: parcelIds } } });
        await prisma.pickupToken.deleteMany({ where: { parcelId: { in: parcelIds } } });
        await prisma.otpToken.deleteMany({ where: { parcelId: { in: parcelIds } } });
        await prisma.notification.deleteMany({ where: { parcelId: { in: parcelIds } } });
        await prisma.parcel.deleteMany({ where: { id: { in: parcelIds } } });
        await prisma.delivery.deleteMany({
          where: { trackingNumber: { startsWith: 'TRK-TEST' } }
        });
      }

      // 3. Reset slot status to AVAILABLE if all parcels were cleared
      for (const slotId of slotIdsToUpdate) {
        const remaining = await prisma.parcel.count({
          where: {
            storageSlotId: slotId,
            status: { in: ['STORED', 'READY_FOR_COLLECTION', 'RECEIVED'] }
          }
        });
        if (remaining === 0) {
          await prisma.storageSlot.update({
            where: { id: slotId },
            data: { status: 'AVAILABLE' }
          });
        }
      }

      // 4. Restore demo guard name/phone if changed
      await prisma.user.updateMany({
        where: { email: 'guard@campusdrop.demo' },
        data: { name: 'Rajesh Kumar', phone: '9876500001' }
      });
      await prisma.guard.updateMany({
        where: { user: { email: 'guard@campusdrop.demo' } },
        data: { name: 'Rajesh Kumar', phone: '9876500001' }
      });
    } catch (e) {
      console.warn('Test data cleanup error:', e);
    }
  };

  beforeAll(async () => {
    await cleanupTestData();

    // 1. Authenticate Demo Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@campusdrop.demo', password: 'CampusDrop@2026' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // 2. Authenticate Demo Guard
    const guardRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guard@campusdrop.demo', password: 'CampusDrop@2026' });
    expect(guardRes.status).toBe(200);
    guardToken = guardRes.body.token;

    // 3. Authenticate Demo Student
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@campusdrop.demo', password: 'CampusDrop@2026' });
    expect(studentRes.status).toBe(200);
    studentToken = studentRes.body.token;

    // Fetch sample student, partner, rack, slot
    const student = await prisma.student.findFirst({ where: { email: 'student@campusdrop.demo' } });
    sampleStudentId = student!.id;

    const partner = await prisma.deliveryPartner.findFirst({ where: { slug: 'amazon' } });
    samplePartnerId = partner!.id;

    let slot = await prisma.storageSlot.findFirst({
      where: { status: 'AVAILABLE' },
      include: { rack: true }
    });
    if (!slot) {
      slot = await prisma.storageSlot.findFirst({
        include: { rack: true }
      });
      if (slot) {
        await prisma.storageSlot.update({
          where: { id: slot.id },
          data: { status: 'AVAILABLE' }
        });
      }
    }
    sampleSlotId = slot!.id;
    sampleRackId = slot!.rackId;
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  describe('1. Authentication & RBAC', () => {
    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@campusdrop.demo', password: 'WrongPassword123' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should get current authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('should forbid student from accessing admin analytics', async () => {
      const res = await request(app)
        .get('/api/analytics/detailed')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('2. Guard Profile & Management', () => {
    it('should get guard profile', async () => {
      const res = await request(app)
        .get('/api/guards/profile')
        .set('Authorization', `Bearer ${guardToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.badgeNumber).toBe('GD-001');
      expect(res.body.data.gateNumber).toBe('Main Gate 1');
    });

    it('should update guard profile name and phone', async () => {
      const res = await request(app)
        .put('/api/guards/profile')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          name: 'Rajesh Kumar Updated',
          phone: '9876500001',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Rajesh Kumar Updated');
    });
  });

  describe('3. Parcel Intake & Manual Storage Assignment', () => {
    it('should register a parcel with manual rack and slot selection and format CD-YYMMDD-XXXX', async () => {
      const res = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          studentId: sampleStudentId,
          deliveryPartnerId: samplePartnerId,
          slotId: sampleSlotId,
          trackingNumber: 'TRK-TEST-998877',
          notes: 'Test fragile box',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.parcelId).toMatch(/^CD-\d{6}-\d{4}$/);
      expect(res.body.data.storage.rack).toBeDefined();
      expect(res.body.data.storage.slot).toBeDefined();

      testParcelId = res.body.data.parcelId;
      activeParcelDbId = res.body.data.internalId;
    });

    it('should allow multiple parcels in the same slot up to capacity', async () => {
      const res = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          studentId: sampleStudentId,
          deliveryPartnerId: samplePartnerId,
          slotId: sampleSlotId,
          trackingNumber: 'TRK-TEST-223344',
          notes: 'Second parcel in same slot',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.parcelId).toMatch(/^CD-\d{6}-\d{4}$/);
      expect(res.body.data.parcelId).not.toBe(testParcelId);
      secondParcelDbId = res.body.data.internalId;
    });

    it('should register an oversized parcel without slot and generate daily sequential reference DD-MM-XXX', async () => {
      // Preview next oversized reference
      const previewRes = await request(app)
        .get('/api/deliveries/next-oversized-ref')
        .set('Authorization', `Bearer ${guardToken}`);

      expect(previewRes.status).toBe(200);
      expect(previewRes.body.data.reference).toMatch(/^\d{2}-\d{2}-\d{3}$/);

      const expectedRef = previewRes.body.data.reference;

      // Create oversized delivery
      const res = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          studentId: sampleStudentId,
          deliveryPartnerId: samplePartnerId,
          storageType: 'OVERSIZED',
          trackingNumber: 'TRK-OVERSIZED-001',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.storageType).toBe('OVERSIZED');
      expect(res.body.data.oversizedReference).toBe(expectedRef);
      expect(res.body.data.storage.rack).toBe('Oversized Storage');

      // Verify parcel can be verified by its oversizedReference
      const verifyRes = await request(app)
        .post('/api/pickup/verify-parcel-qr')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          token: expectedRef,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.parcel.oversizedReference).toBe(expectedRef);
      expect(verifyRes.body.data.parcel.storageLocation).toContain(expectedRef);
    });
  });

  describe('4. Storage Matrix & Deletion Restriction Rules', () => {
    it('should return storage overview with capacity and occupied counts', async () => {
      const res = await request(app)
        .get('/api/storage')
        .set('Authorization', `Bearer ${guardToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalCapacity).toBeGreaterThan(0);
      expect(res.body.data.racks.length).toBeGreaterThan(0);
    });

    it('should block deleting a storage rack that contains active parcels', async () => {
      const res = await request(app)
        .delete(`/api/storage/racks/${sampleRackId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('Cannot delete this storage location because parcels are currently stored here');
    });

    it('should block deleting a storage slot that contains active parcels', async () => {
      const res = await request(app)
        .delete(`/api/storage/slots/${sampleSlotId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('Cannot delete this storage location because parcels are currently stored here');
    });
  });

  describe('5. Pickup QR Generation, Scanning, and Atomic Handover', () => {
    let pickupTokenString: string;

    it('should generate a secure single-use pickup QR token for the student', async () => {
      const res = await request(app)
        .post('/api/pickups/qr')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ parcelId: activeParcelDbId });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      pickupTokenString = res.body.data.token;
    });

    it('should verify the scanned QR code on the Guard scanner', async () => {
      const res = await request(app)
        .post('/api/pickups/verify-qr')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({ token: pickupTokenString });

      expect(res.status).toBe(200);
      expect(res.body.data.isValid).toBe(true);
      expect(res.body.data.targetParcel.parcelId).toBe(testParcelId);
    });

    it('should complete handover and update status to COLLECTED', async () => {
      const res = await request(app)
        .post('/api/pickups/complete')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          parcelId: activeParcelDbId,
          verificationMethod: 'QR',
          verificationToken: pickupTokenString,
          notes: 'Handed over successfully',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedParcel = await prisma.parcel.findUnique({
        where: { id: activeParcelDbId }
      });
      expect(updatedParcel!.status).toBe('COLLECTED');
    });

    let otpCodeString: string;

    it('should generate an OTP code for student parcel', async () => {
      const res = await request(app)
        .post('/api/pickups/otp')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ parcelId: secondParcelDbId });

      expect(res.status).toBe(200);
      expect(res.body.data.otpCode).toBeDefined();
      expect(res.body.data.otpCode).toMatch(/^\d{6}$/);
      otpCodeString = res.body.data.otpCode;
    });

    it('should verify the 6-digit OTP on the Guard scanner and return parcel + student details', async () => {
      const res = await request(app)
        .post('/api/pickups/verify-otp')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({ otpCode: otpCodeString });

      expect(res.status).toBe(200);
      expect(res.body.data.isValid).toBe(true);
      expect(res.body.data.otpCode).toBe(otpCodeString);
      expect(res.body.data.parcel.id).toBe(secondParcelDbId);
      expect(res.body.data.student.name).toBeDefined();
    });

    it('should reject OTP handover if OTP verification token is omitted', async () => {
      const res = await request(app)
        .post('/api/pickups/complete')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          parcelId: secondParcelDbId,
          verificationMethod: 'OTP',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('OTP code is required for OTP verification handover');
    });

    it('should complete handover with verified OTP and update status to COLLECTED', async () => {
      const res = await request(app)
        .post('/api/pickups/complete')
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          parcelId: secondParcelDbId,
          verificationMethod: 'OTP',
          verificationToken: otpCodeString,
          notes: 'Handed over with verified WhatsApp OTP',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedParcel = await prisma.parcel.findUnique({
        where: { id: secondParcelDbId }
      });
      expect(updatedParcel!.status).toBe('COLLECTED');

      const activeOtpRecord = await prisma.otpToken.findFirst({
        where: {
          parcelId: secondParcelDbId,
          otpCode: otpCodeString,
          isUsed: false,
        }
      });
      expect(activeOtpRecord).toBeNull();
    });
  });

  describe('6. Admin Guard Management', () => {
    let createdGuardId: string;

    it('should allow admin to add a new guard', async () => {
      const res = await request(app)
        .post('/api/guards')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Karan Singh',
          badgeNumber: 'GD-099',
          phone: '9876599999',
          email: 'karansingh@campusdrop.demo',
          password: 'CampusDrop@2026',
          gateNumber: 'Main Gate 1',
          shift: 'Morning',
          isActive: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.badgeNumber).toBe('GD-099');
      createdGuardId = res.body.data.id;
    });

    it('should allow admin to update guard details', async () => {
      const res = await request(app)
        .put(`/api/guards/${createdGuardId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          gateNumber: 'Main Gate 2',
          shift: 'Evening',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.gateNumber).toBe('Main Gate 2');
    });

    it('should allow admin to soft-delete / remove guard', async () => {
      const res = await request(app)
        .delete(`/api/guards/${createdGuardId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('removed successfully');
    });
  });
});
