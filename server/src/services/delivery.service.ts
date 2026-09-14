import { prisma } from '../config';
import { storageService } from './storage.service';
import { notificationService } from './notification/notification.service';
import { auditService } from './audit.service';
import { generateUniqueParcelId } from '../utils/parcelId';
import { generateUniqueOversizedReference, previewNextOversizedReference } from '../utils/oversizedReference';
import { generateDeliveryNumber, generateOtp, maskPhoneNumber } from '../utils/helpers';
import { NotFoundError, ConflictError } from '../utils/errors';
import { DeliveryStatus, ParcelStatus, StorageType, NotificationType, Prisma } from '@prisma/client';

export interface CreateDeliveryInput {
  studentId: string;
  deliveryPartnerId: string;
  storageType?: 'RACK' | 'OVERSIZED';
  rackId?: string | null;
  slotId?: string | null;
  trackingNumber?: string | null;
  notes?: string | null;
}

export class DeliveryService {
  /**
   * Search student database by phone, roll number, or name
   */
  async searchStudents(query: string, limit = 10) {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const students = await prisma.student.findMany({
      where: {
        OR: [
          { phone: { contains: cleanQuery } },
          { studentId: { contains: cleanQuery, mode: 'insensitive' } },
          { name: { contains: cleanQuery, mode: 'insensitive' } },
          { email: { contains: cleanQuery, mode: 'insensitive' } },
        ]
      },
      take: limit,
      include: {
        parcels: {
          where: {
            status: { in: [ParcelStatus.STORED, ParcelStatus.READY_FOR_COLLECTION, ParcelStatus.RECEIVED] }
          },
          include: {
            storageSlot: { include: { rack: true } },
            delivery: { include: { deliveryPartner: true } },
          }
        }
      }
    });

    return students.map(s => ({
      id: s.id,
      name: s.name,
      studentId: s.studentId,
      phone: s.phone,
      maskedPhone: maskPhoneNumber(s.phone),
      email: s.email,
      hostel: s.hostel,
      room: s.room,
      department: s.department,
      year: s.year,
      activeParcelsCount: s.parcels.length,
      activeParcels: s.parcels.map(p => ({
        id: p.id,
        parcelId: p.parcelId,
        partner: p.delivery.deliveryPartner.name,
        partnerColor: p.delivery.deliveryPartner.color,
        storageType: p.storageType,
        oversizedReference: p.oversizedReference,
        slot: p.storageType === StorageType.OVERSIZED
          ? `Oversized (Ref: ${p.oversizedReference})`
          : (p.storageSlot ? `${p.storageSlot.rack.name} · Slot ${p.storageSlot.slotNumber}` : 'Hub'),
        rackName: p.storageType === StorageType.OVERSIZED ? 'Oversized Storage' : p.storageSlot?.rack.name,
        slotNumber: p.storageType === StorageType.OVERSIZED ? (p.oversizedReference || 'Oversized') : p.storageSlot?.slotNumber,
        notes: p.notes,
        trackingNumber: p.trackingNumber,
        status: p.status,
        receivedAt: p.createdAt,
      }))
    }));
  }

  /**
   * Register a new parcel delivery at the main gate with manual rack/slot or oversized storage selection
   */
  async createDelivery(input: CreateDeliveryInput, guardId: string, clientMeta?: { ip?: string; userAgent?: string; userId?: string }) {
    // 1. Verify Student
    const student = await prisma.student.findUnique({
      where: { id: input.studentId },
    });
    if (!student) throw new NotFoundError('Selected student was not found in university directory');

    // 2. Verify Delivery Partner
    const partner = await prisma.deliveryPartner.findUnique({
      where: { id: input.deliveryPartnerId },
    });
    if (!partner) throw new NotFoundError('Selected delivery partner was not found');

    const isOversized = input.storageType === 'OVERSIZED';

    if (!isOversized && !input.slotId) {
      throw new ConflictError('Please select a storage rack and slot location.');
    }

    const deliveryNumber = generateDeliveryNumber();
    const parcelId = await generateUniqueParcelId();
    const qrToken = `qr_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const qrPayload = {
      type: 'campusdrop_parcel',
      parcelId,
      token: qrToken,
    };
    const qrData = JSON.stringify(qrPayload);
    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let assignedSlot: { id: string; slotNumber: string; rackName: string; rackId: string } | null = null;
    let oversizedReference: string | null = null;

    // 3. Database Transaction for Atomicity
    const result = await prisma.$transaction(async (tx) => {
      if (isOversized) {
        oversizedReference = await generateUniqueOversizedReference(tx);
      } else {
        assignedSlot = await storageService.assignManualSlot(input.slotId!, tx);
      }

      // Create Delivery record
      const delivery = await tx.delivery.create({
        data: {
          deliveryNumber,
          studentId: student.id,
          guardId,
          deliveryPartnerId: partner.id,
          status: DeliveryStatus.STORED,
          trackingNumber: input.trackingNumber ? input.trackingNumber.trim() : null,
          notes: input.notes ? input.notes.trim() : null,
          receivedAt: new Date(),
        }
      });

      // Create Parcel record with unique Parcel ID & QR Token
      const parcel = await tx.parcel.create({
        data: {
          parcelId,
          deliveryId: delivery.id,
          studentId: student.id,
          storageType: isOversized ? StorageType.OVERSIZED : StorageType.RACK,
          storageSlotId: assignedSlot ? assignedSlot.id : null,
          oversizedReference: isOversized ? oversizedReference : null,
          status: ParcelStatus.STORED,
          notes: input.notes ? input.notes.trim() : null,
          trackingNumber: input.trackingNumber ? input.trackingNumber.trim() : null,
          receivedById: guardId,
          receivedByGuardId: guardId,
          receivedAt: new Date(),
          qrToken,
          qrData,
          whatsappStatus: 'QUEUED',
          otpCode,
          otpExpiresAt,
        }
      });

      // Create OTP token
      await tx.otpToken.create({
        data: {
          otpCode,
          parcelId: parcel.id,
          studentId: student.id,
          expiresAt: otpExpiresAt,
        }
      });

      return { delivery, parcel };
    });

    // Fetch guard details
    const guard = await prisma.guard.findUnique({
      where: { id: guardId }
    });

    const storageLocationText = isOversized
      ? `Oversized Storage (Ref: ${oversizedReference})`
      : `${assignedSlot!.rackName} · Slot ${assignedSlot!.slotNumber}`;

    // 4. Record Audit Log
    await auditService.log({
      userId: clientMeta?.userId,
      role: 'GUARD',
      action: 'PARCEL_STORED',
      entity: 'Parcel',
      entityId: result.parcel.id,
      ipAddress: clientMeta?.ip,
      userAgent: clientMeta?.userAgent,
      metadata: {
        parcelId,
        studentName: student.name,
        studentRoll: student.studentId,
        partner: partner.name,
        storageType: isOversized ? 'OVERSIZED' : 'RACK',
        oversizedReference: isOversized ? oversizedReference : null,
        storageLocation: storageLocationText,
        guardName: guard?.name,
        guardBadge: guard?.badgeNumber,
      }
    });

    // 5. Send WhatsApp notification
    notificationService.send({
      type: NotificationType.ARRIVAL_NORMAL,
      studentId: student.id,
      deliveryId: result.delivery.id,
      parcelId: result.parcel.id,
      recipientPhone: student.phone,
      studentName: student.name,
      partnerName: partner.name,
      customParcelId: parcelId,
      trackingNumber: input.trackingNumber,
      rackName: isOversized ? 'Oversized Storage' : assignedSlot!.rackName,
      slotNumber: isOversized ? (oversizedReference || 'Oversized Area') : assignedSlot!.slotNumber,
    }).catch(console.error);

    return {
      deliveryId: result.delivery.id,
      parcelId: result.parcel.parcelId,
      internalId: result.parcel.id,
      deliveryNumber,
      status: DeliveryStatus.STORED,
      qrToken,
      qrData,
      qrPayload,
      whatsappStatus: 'QUEUED',
      storageType: isOversized ? 'OVERSIZED' : 'RACK',
      oversizedReference: isOversized ? oversizedReference : null,
      student: {
        id: student.id,
        name: student.name,
        studentId: student.studentId,
        phone: student.phone,
        maskedPhone: maskPhoneNumber(student.phone),
        hostel: student.hostel,
        room: student.room,
      },
      partner: {
        id: partner.id,
        name: partner.name,
        color: partner.color,
      },
      storage: isOversized ? {
        storageType: 'OVERSIZED',
        oversizedReference,
        slotId: null,
        rack: 'Oversized Storage',
        slot: `Ref: ${oversizedReference}`,
        location: storageLocationText,
      } : {
        storageType: 'RACK',
        oversizedReference: null,
        slotId: assignedSlot!.id,
        rack: assignedSlot!.rackName,
        slot: assignedSlot!.slotNumber,
        location: storageLocationText,
      },
      guard: guard ? {
        id: guard.id,
        name: guard.name,
        badgeNumber: guard.badgeNumber,
        gateNumber: guard.gateNumber,
      } : null,
      receivedAt: result.delivery.receivedAt,
    };
  }

  /**
   * Get detailed parcel information by parcelId (e.g. CD-260902-0001), oversizedReference, or UUID id
   */
  async getParcelDetails(identifier: string) {
    const parcel = await prisma.parcel.findFirst({
      where: {
        OR: [
          { id: identifier },
          { parcelId: identifier },
          { oversizedReference: identifier },
        ]
      },
      include: {
        student: true,
        storageSlot: { include: { rack: true } },
        delivery: {
          include: {
            deliveryPartner: true,
            guard: true,
          }
        },
        pickups: {
          include: { guard: true },
          orderBy: { verifiedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!parcel) throw new NotFoundError('Parcel not found');

    const pickup = parcel.pickups[0];

    return {
      id: parcel.id,
      parcelId: parcel.parcelId,
      storageType: parcel.storageType,
      oversizedReference: parcel.oversizedReference,
      status: parcel.status,
      notes: parcel.notes,
      trackingNumber: parcel.trackingNumber,
      qrToken: parcel.qrToken,
      qrData: parcel.qrData,
      whatsappStatus: parcel.whatsappStatus || 'QUEUED',
      whatsappError: parcel.whatsappError,
      whatsappLastUpdatedAt: parcel.whatsappLastUpdatedAt,
      createdAt: parcel.createdAt,
      collectedAt: parcel.collectedAt,
      student: {
        id: parcel.student.id,
        name: parcel.student.name,
        studentId: parcel.student.studentId,
        phone: parcel.student.phone,
        maskedPhone: maskPhoneNumber(parcel.student.phone),
        email: parcel.student.email,
        hostel: parcel.student.hostel,
        room: parcel.student.room,
        department: parcel.student.department,
      },
      partner: {
        id: parcel.delivery.deliveryPartner.id,
        name: parcel.delivery.deliveryPartner.name,
        color: parcel.delivery.deliveryPartner.color,
      },
      storage: parcel.storageType === StorageType.OVERSIZED || !parcel.storageSlot ? {
        id: 'oversized',
        storageType: 'OVERSIZED',
        oversizedReference: parcel.oversizedReference,
        rackName: 'Oversized Storage',
        slotNumber: parcel.oversizedReference ? `Ref: ${parcel.oversizedReference}` : 'Oversized',
        location: `Oversized Storage${parcel.oversizedReference ? ` (Ref: ${parcel.oversizedReference})` : ''}`,
      } : {
        id: parcel.storageSlot.id,
        storageType: 'RACK',
        rackId: parcel.storageSlot.rackId,
        rackName: parcel.storageSlot.rack.name,
        slotNumber: parcel.storageSlot.slotNumber,
        location: `${parcel.storageSlot.rack.name} · Slot ${parcel.storageSlot.slotNumber}`,
      },
      receivedBy: {
        id: parcel.delivery.guard.id,
        name: parcel.delivery.guard.name,
        badgeNumber: parcel.delivery.guard.badgeNumber,
        gateNumber: parcel.delivery.guard.gateNumber,
      },
      receivedAt: parcel.delivery.receivedAt,
      handedOverBy: pickup ? {
        id: pickup.guard.id,
        name: pickup.guard.name,
        badgeNumber: pickup.guard.badgeNumber,
      } : null,
      handedOverAt: pickup ? pickup.verifiedAt : null,
      verificationMethod: pickup ? pickup.verificationMethod : null,
    };
  }

  /**
   * Preview next sequential oversized reference for today
   */
  async getNextOversizedRef() {
    return previewNextOversizedReference();
  }

  /**
   * Get paginated deliveries ledger
   */
  async getDeliveries(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: DeliveryStatus;
    partnerId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 25));
    const skip = (page - 1) * limit;

    const where: Prisma.DeliveryWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.partnerId) {
      where.deliveryPartnerId = params.partnerId;
    }

    if (params.startDate || params.endDate) {
      where.receivedAt = {};
      if (params.startDate) {
        where.receivedAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.receivedAt.lte = end;
      }
    }

    if (params.search) {
      const s = params.search.trim();
      where.OR = [
        { deliveryNumber: { contains: s, mode: 'insensitive' } },
        { trackingNumber: { contains: s, mode: 'insensitive' } },
        { student: { name: { contains: s, mode: 'insensitive' } } },
        { student: { studentId: { contains: s, mode: 'insensitive' } } },
        { student: { phone: { contains: s } } },
        { parcel: { parcelId: { contains: s, mode: 'insensitive' } } },
        { parcel: { oversizedReference: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [total, deliveries] = await Promise.all([
      prisma.delivery.count({ where }),
      prisma.delivery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedAt: 'desc' },
        include: {
          student: true,
          guard: true,
          deliveryPartner: true,
          parcel: {
            include: {
              storageSlot: { include: { rack: true } }
            }
          }
        }
      })
    ]);

    return {
      data: deliveries.map(d => ({
        id: d.id,
        deliveryNumber: d.deliveryNumber,
        status: d.status,
        trackingNumber: d.trackingNumber,
        notes: d.notes,
        receivedAt: d.receivedAt,
        completedAt: d.completedAt,
        student: {
          id: d.student.id,
          name: d.student.name,
          studentId: d.student.studentId,
          maskedPhone: maskPhoneNumber(d.student.phone),
        },
        partner: {
          id: d.deliveryPartner.id,
          name: d.deliveryPartner.name,
          color: d.deliveryPartner.color,
        },
        guard: {
          id: d.guard.id,
          name: d.guard.name,
          badgeNumber: d.guard.badgeNumber,
        },
        parcel: d.parcel ? {
          id: d.parcel.id,
          parcelId: d.parcel.parcelId,
          storageType: d.parcel.storageType,
          oversizedReference: d.parcel.oversizedReference,
          slot: d.parcel.storageType === StorageType.OVERSIZED
            ? `Oversized (Ref: ${d.parcel.oversizedReference})`
            : (d.parcel.storageSlot ? `${d.parcel.storageSlot.rack.name} · Slot ${d.parcel.storageSlot.slotNumber}` : 'Hub'),
          slotId: d.parcel.storageSlotId,
          qrToken: d.parcel.qrToken,
          qrData: d.parcel.qrData,
          whatsappStatus: d.parcel.whatsappStatus || 'QUEUED',
          whatsappError: d.parcel.whatsappError,
          whatsappLastUpdatedAt: d.parcel.whatsappLastUpdatedAt,
        } : null
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async getDeliveryPartners() {
    return prisma.deliveryPartner.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }
}

export const deliveryService = new DeliveryService();
