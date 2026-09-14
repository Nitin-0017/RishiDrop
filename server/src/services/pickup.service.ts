import { prisma, config } from '../config';
import { storageService } from './storage.service';
import { notificationService } from './notification/notification.service';
import { auditService } from './audit.service';
import { generatePickupToken, generateOtp, maskPhoneNumber } from '../utils/helpers';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { ParcelStatus, DeliveryStatus, VerificationMethod, NotificationType } from '@prisma/client';
import { emitSocketEvent } from '../utils/socketEmitter';

export class PickupService {
  /**
   * Generates a single-use, short-lived pickup QR token for a student parcel
   */
  async generateQrToken(parcelId: string, studentId: string) {
    const parcel = await prisma.parcel.findFirst({
      where: {
        OR: [
          { id: parcelId },
          { parcelId: parcelId },
        ],
        studentId,
        status: { in: [ParcelStatus.STORED, ParcelStatus.READY_FOR_COLLECTION, ParcelStatus.RECEIVED] },
      },
      include: {
        delivery: { include: { deliveryPartner: true } },
        storageSlot: { include: { rack: true } },
      }
    });

    if (!parcel) {
      throw new NotFoundError('Active stored parcel not found or already collected');
    }

    // Invalidate existing unused tokens for this parcel
    await prisma.pickupToken.updateMany({
      where: { parcelId: parcel.id, isUsed: false },
      data: { isUsed: true }
    });

    const token = generatePickupToken();
    const expiresAt = new Date(Date.now() + config.pickup.qrExpiryMinutes * 60 * 1000);

    const pickupToken = await prisma.pickupToken.create({
      data: {
        token,
        parcelId: parcel.id,
        studentId,
        expiresAt,
      }
    });

    // Also update parcel QR expiry
    await prisma.parcel.update({
      where: { id: parcel.id },
      data: { qrData: token, qrExpiresAt: expiresAt }
    });

    return {
      token: pickupToken.token,
      expiresAt: pickupToken.expiresAt,
      validityMinutes: config.pickup.qrExpiryMinutes,
      parcel: {
        id: parcel.id,
        parcelId: parcel.parcelId,
        partner: parcel.delivery.deliveryPartner.name,
        location: parcel.storageSlot ? `${parcel.storageSlot.rack.name} (Slot ${parcel.storageSlot.slotNumber})` : 'Main Gate Delivery Hub',
      }
    };
  }

  /**
   * Generates or refreshes a 6-digit pickup OTP
   */
  async generateOtp(parcelId: string, studentId: string) {
    const parcel = await prisma.parcel.findFirst({
      where: {
        OR: [
          { id: parcelId },
          { parcelId: parcelId },
        ],
        studentId,
        status: { in: [ParcelStatus.STORED, ParcelStatus.READY_FOR_COLLECTION, ParcelStatus.RECEIVED] },
      },
      include: {
        delivery: { include: { deliveryPartner: true } }
      }
    });

    if (!parcel) {
      throw new NotFoundError('Active stored parcel not found or already collected');
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + config.pickup.otpExpiryMinutes * 60 * 1000);

    await prisma.otpToken.create({
      data: {
        otpCode,
        parcelId: parcel.id,
        studentId,
        expiresAt,
      }
    });

    await prisma.parcel.update({
      where: { id: parcel.id },
      data: { otpCode, otpExpiresAt: expiresAt }
    });

    return {
      otpCode,
      expiresAt,
      validityMinutes: config.pickup.otpExpiryMinutes,
      parcelId: parcel.parcelId,
      partner: parcel.delivery.deliveryPartner.name,
    };
  }

  /**
   * Guard scans Student QR code -> validates token and returns student info + parcel ready for handover
   */
  async verifyQrToken(token: string) {
    const cleanToken = token.trim();

    const pickupToken = await prisma.pickupToken.findUnique({
      where: { token: cleanToken },
      include: {
        student: true,
        parcel: {
          include: {
            delivery: { include: { deliveryPartner: true } },
            storageSlot: { include: { rack: true } },
          }
        }
      }
    });

    if (!pickupToken) {
      throw new NotFoundError('Invalid pickup QR code. Token does not exist.');
    }

    if (pickupToken.isUsed) {
      throw new ConflictError('This QR code pass has already been used.');
    }

    if (new Date() > pickupToken.expiresAt) {
      throw new BadRequestError('This QR code pass has expired. Please ask the student to regenerate.');
    }

    if (pickupToken.parcel.status === ParcelStatus.COLLECTED) {
      throw new ConflictError('This parcel has already been collected.');
    }

    // Also fetch all active stored parcels for this student in case multiple packages arrived
    const allActiveParcels = await prisma.parcel.findMany({
      where: {
        studentId: pickupToken.studentId,
        status: ParcelStatus.STORED,
      },
      include: {
        delivery: { include: { deliveryPartner: true } },
        storageSlot: { include: { rack: true } },
      }
    });

    return {
      isValid: true,
      token: pickupToken.token,
      student: {
        id: pickupToken.student.id,
        name: pickupToken.student.name,
        studentId: pickupToken.student.studentId,
        phone: pickupToken.student.phone,
        maskedPhone: maskPhoneNumber(pickupToken.student.phone),
        hostel: pickupToken.student.hostel,
        room: pickupToken.student.room,
        department: pickupToken.student.department,
      },
      targetParcel: {
        id: pickupToken.parcel.id,
        parcelId: pickupToken.parcel.parcelId,
        partner: pickupToken.parcel.delivery.deliveryPartner.name,
        partnerColor: pickupToken.parcel.delivery.deliveryPartner.color,
        slot: pickupToken.parcel.storageSlot ? `${pickupToken.parcel.storageSlot.rack.code}${pickupToken.parcel.storageSlot.slotNumber}` : 'N/A',
        rackName: pickupToken.parcel.storageSlot?.rack.name,
        slotNumber: pickupToken.parcel.storageSlot?.slotNumber,
        receivedAt: pickupToken.parcel.delivery.receivedAt,
      },
      allActiveParcels: allActiveParcels.map(p => ({
        id: p.id,
        parcelId: p.parcelId,
        partner: p.delivery.deliveryPartner.name,
        partnerColor: p.delivery.deliveryPartner.color,
        slot: p.storageSlot ? `${p.storageSlot.rack.code}${p.storageSlot.slotNumber}` : 'N/A',
        rackName: p.storageSlot?.rack.name,
        slotNumber: p.storageSlot?.slotNumber,
        receivedAt: p.delivery.receivedAt,
      }))
    };
  }

  /**
   * Guard verifies OTP code for a parcel
   */
  async verifyOtp(parcelIdOrOtp: string, maybeOtp?: string) {
    const cleanOtp = (maybeOtp || parcelIdOrOtp || '').trim();
    const parcelCandidate = maybeOtp && maybeOtp.trim() !== parcelIdOrOtp.trim() ? parcelIdOrOtp.trim() : undefined;

    let parcel = null;
    let otpRecord = null;

    if (parcelCandidate) {
      parcel = await prisma.parcel.findFirst({
        where: {
          OR: [
            { id: parcelCandidate },
            { parcelId: parcelCandidate },
          ]
        },
        include: {
          student: true,
          delivery: { include: { deliveryPartner: true } },
          storageSlot: { include: { rack: true } },
        }
      });
    }

    if (!parcel) {
      // Find active OTP record across stored parcels
      otpRecord = await prisma.otpToken.findFirst({
        where: {
          otpCode: cleanOtp,
          isUsed: false,
          parcel: {
            status: { in: [ParcelStatus.STORED, ParcelStatus.READY_FOR_COLLECTION, ParcelStatus.RECEIVED] }
          }
        },
        include: {
          parcel: {
            include: {
              student: true,
              delivery: { include: { deliveryPartner: true } },
              storageSlot: { include: { rack: true } },
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      if (otpRecord?.parcel) {
        parcel = otpRecord.parcel as any;
      }
    }

    if (!parcel) {
      // Check direct parcel.otpCode
      parcel = await prisma.parcel.findFirst({
        where: {
          otpCode: cleanOtp,
          status: { in: [ParcelStatus.STORED, ParcelStatus.READY_FOR_COLLECTION, ParcelStatus.RECEIVED] }
        },
        include: {
          student: true,
          delivery: { include: { deliveryPartner: true } },
          storageSlot: { include: { rack: true } },
        }
      });
    }

    // If still not found, check if this OTP belonged to an already collected parcel
    if (!parcel) {
      const collectedParcel = await prisma.parcel.findFirst({
        where: {
          OR: [
            { otpCode: cleanOtp },
            { otpTokens: { some: { otpCode: cleanOtp } } }
          ],
          status: ParcelStatus.COLLECTED
        }
      });
      if (collectedParcel) {
        throw new ConflictError('This parcel has already been collected.');
      }
      throw new BadRequestError('Invalid OTP code. Please verify with the student.');
    }

    if (parcel.status === ParcelStatus.COLLECTED) {
      throw new ConflictError('This parcel has already been collected.');
    }

    if (!otpRecord) {
      otpRecord = await prisma.otpToken.findFirst({
        where: {
          parcelId: parcel.id,
          otpCode: cleanOtp,
          isUsed: false,
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    const isDirectMatch = parcel.otpCode === cleanOtp && (!parcel.otpExpiresAt || new Date() <= parcel.otpExpiresAt);

    if (!otpRecord && !isDirectMatch) {
      throw new BadRequestError('Invalid OTP code. Please verify with the student.');
    }

    if (otpRecord && new Date() > otpRecord.expiresAt) {
      throw new BadRequestError('OTP code has expired. Please ask student to generate a new one.');
    }

    return {
      isValid: true,
      otpCode: cleanOtp,
      token: cleanOtp,
      student: {
        id: parcel.student.id,
        name: parcel.student.name,
        studentId: parcel.student.studentId,
        maskedPhone: maskPhoneNumber(parcel.student.phone),
        hostel: parcel.student.hostel,
        room: parcel.student.room,
      },
      parcel: {
        id: parcel.id,
        parcelId: parcel.parcelId,
        partner: parcel.delivery.deliveryPartner.name,
        slot: parcel.storageSlot ? `${parcel.storageSlot.rack.name} → Slot ${parcel.storageSlot.slotNumber}` : 'Hub Storage',
      }
    };
  }

  /**
   * Guard scans parcel QR code -> validates QR and returns student & parcel details for handover confirmation
   */
  async verifyParcelQr(scannedString: string, guardUserId?: string) {
    if (!scannedString || typeof scannedString !== 'string') {
      throw new BadRequestError('Scanned QR code data is required');
    }

    const cleanString = scannedString.trim();
    let parcelIdCandidate: string | null = null;
    let qrTokenCandidate: string | null = null;

    // 1. Check if scanned data is JSON
    if (cleanString.startsWith('{') && cleanString.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanString);
        if (parsed.type === 'campusdrop_parcel') {
          parcelIdCandidate = parsed.parcelId || null;
          qrTokenCandidate = parsed.token || null;
        } else {
          throw new BadRequestError('Invalid QR code format. Not a CampusDrop parcel QR.');
        }
      } catch (err: any) {
        if (err instanceof BadRequestError) throw err;
      }
    }

    // 2. Check if scanned data is a URL with query params
    if (!parcelIdCandidate && !qrTokenCandidate && (cleanString.startsWith('http://') || cleanString.startsWith('https://') || cleanString.includes('?'))) {
      try {
        const urlObj = new URL(cleanString, 'https://campusdrop.local');
        parcelIdCandidate = urlObj.searchParams.get('parcelId') || urlObj.searchParams.get('id');
        qrTokenCandidate = urlObj.searchParams.get('token');
      } catch {}
    }

    // 3. Raw string checks
    if (!parcelIdCandidate && !qrTokenCandidate) {
      if (cleanString.startsWith('CD-QR-')) {
        qrTokenCandidate = cleanString;
      } else if (cleanString.startsWith('CD-')) {
        parcelIdCandidate = cleanString;
      } else {
        qrTokenCandidate = cleanString;
      }
    }

    // 4. Query Parcel
    let parcel = await prisma.parcel.findFirst({
      where: {
        OR: [
          ...(parcelIdCandidate ? [{ parcelId: parcelIdCandidate }, { id: parcelIdCandidate }] : []),
          ...(qrTokenCandidate ? [{ qrToken: qrTokenCandidate }, { qrData: qrTokenCandidate }, { id: qrTokenCandidate }] : []),
          { parcelId: cleanString },
          { oversizedReference: cleanString },
        ]
      },
      include: {
        student: true,
        delivery: {
          include: {
            deliveryPartner: true,
            guard: true,
          }
        },
        storageSlot: {
          include: {
            rack: true,
          }
        }
      }
    });

    // 5. If not found directly, check if it's a Student PickupToken
    if (!parcel) {
      const pickupToken = await prisma.pickupToken.findUnique({
        where: { token: cleanString },
        include: {
          parcel: {
            include: {
              student: true,
              delivery: {
                include: {
                  deliveryPartner: true,
                  guard: true,
                }
              },
              storageSlot: {
                include: {
                  rack: true,
                }
              }
            }
          }
        }
      });

      if (pickupToken?.parcel) {
        parcel = pickupToken.parcel as any;
      }
    }

    if (!parcel) {
      throw new NotFoundError('Invalid CampusDrop QR code. No parcel found matching this QR code.');
    }

    // 6. Check if already collected
    if (parcel.status === ParcelStatus.COLLECTED) {
      const collectedDate = parcel.collectedAt ? new Date(parcel.collectedAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) : 'earlier';
      throw new ConflictError(`This parcel has already been collected on ${collectedDate} by ${parcel.student.name}.`);
    }

    // 7. Resolve guard who received the parcel
    let receivedGuardText = 'Main Gate Security';
    if (parcel.receivedByGuardId) {
      const recGuard = await prisma.guard.findFirst({
        where: {
          OR: [
            { id: parcel.receivedByGuardId },
            { userId: parcel.receivedByGuardId }
          ]
        }
      });
      if (recGuard) {
        receivedGuardText = `${recGuard.name} (${recGuard.badgeNumber})`;
      }
    } else if (parcel.delivery.guard) {
      receivedGuardText = `${parcel.delivery.guard.name} (${parcel.delivery.guard.badgeNumber})`;
    }

    // 8. Resolve currently logged-in guard scanning
    let scanningGuard = null;
    if (guardUserId) {
      scanningGuard = await prisma.guard.findFirst({
        where: {
          OR: [
            { id: guardUserId },
            { userId: guardUserId }
          ]
        }
      });
    }
    if (!scanningGuard) {
      scanningGuard = await prisma.guard.findFirst({
        where: { isActive: true }
      });
    }

    const scannedByGuard = scanningGuard ? {
      id: scanningGuard.id,
      name: scanningGuard.name,
      badgeNumber: scanningGuard.badgeNumber,
      displayText: `${scanningGuard.name} (${scanningGuard.badgeNumber})`,
    } : {
      id: 'guard-default',
      name: 'Duty Guard',
      badgeNumber: 'GD-001',
      displayText: 'Duty Guard (GD-001)',
    };

    const isOversized = parcel.storageType === 'OVERSIZED' || !parcel.storageSlot;
    const storageLocation = isOversized
      ? `Oversized Storage (Ref: ${parcel.oversizedReference || 'N/A'})`
      : `${parcel.storageSlot!.rack.name}, Slot ${parcel.storageSlot!.slotNumber}`;

    return {
      isValid: true,
      parcel: {
        id: parcel.id,
        parcelId: parcel.parcelId,
        trackingNumber: parcel.trackingNumber || parcel.delivery.trackingNumber || 'N/A',
        partner: parcel.delivery.deliveryPartner.name,
        partnerColor: parcel.delivery.deliveryPartner.color,
        status: parcel.status,
        storageType: parcel.storageType,
        oversizedReference: parcel.oversizedReference,
        storageLocation,
        rackName: isOversized ? 'Oversized Storage' : parcel.storageSlot!.rack.name,
        slotNumber: isOversized ? (parcel.oversizedReference || 'Oversized') : String(parcel.storageSlot!.slotNumber),
        slotCode: isOversized ? (parcel.oversizedReference || 'OVERSIZED') : `${parcel.storageSlot!.rack.code}-${parcel.storageSlot!.slotNumber}`,
        receivedAt: parcel.receivedAt || parcel.delivery.receivedAt,
        receivedByGuard: receivedGuardText,
        qrToken: parcel.qrToken || cleanString,
        qrData: parcel.qrData,
      },
      student: {
        id: parcel.student.id,
        name: parcel.student.name,
        studentId: parcel.student.studentId,
        phone: parcel.student.phone,
        maskedPhone: maskPhoneNumber(parcel.student.phone),
        hostel: parcel.student.hostel || 'N/A',
        room: parcel.student.room || 'N/A',
        department: parcel.student.department || 'N/A',
      },
      scannedByGuard,
    };
  }

  /**
   * Complete Handover Transaction:
   * 1. Validates parcel not already collected
   * 2. Marks Parcel COLLECTED
   * 3. Marks Delivery COLLECTED
   * 4. Frees Storage Slot (AVAILABLE)
   * 5. Creates Pickup record
   * 6. Writes Audit Log
   * 7. Invalidates tokens
   * 8. Triggers WhatsApp Collection Confirmation
   * 9. Emits Socket.IO real-time updates
   */
  async completeHandover(
    parcelId: string,
    guardId: string,
    verificationMethod: VerificationMethod,
    verificationToken?: string | null,
    notes?: string | null,
    clientMeta?: { ip?: string; userAgent?: string; userId?: string }
  ) {
    const now = new Date();

    // Resolve Guard entity
    let actualGuard = await prisma.guard.findFirst({
      where: {
        OR: [
          { id: guardId },
          { userId: guardId }
        ]
      }
    });
    if (!actualGuard) {
      actualGuard = await prisma.guard.findFirst({ where: { isActive: true } });
    }
    const resolvedGuardId = actualGuard ? actualGuard.id : guardId;

    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Lock and fetch parcel
      const parcel = await tx.parcel.findFirst({
        where: {
          OR: [
            { id: parcelId },
            { parcelId: parcelId }
          ]
        },
        include: {
          student: true,
          delivery: { include: { deliveryPartner: true } },
          storageSlot: { include: { rack: true } },
        }
      });

      if (!parcel) throw new NotFoundError('Parcel not found');
      if (parcel.status === ParcelStatus.COLLECTED) {
        throw new ConflictError('This parcel was already handed over and collected!');
      }

      // Validate OTP if handover is verified via OTP
      if (verificationMethod === VerificationMethod.OTP) {
        if (!verificationToken) {
          throw new BadRequestError('OTP code is required for OTP verification handover');
        }
        const cleanToken = verificationToken.trim();
        const activeOtpRecord = await tx.otpToken.findFirst({
          where: {
            parcelId: parcel.id,
            otpCode: cleanToken,
            isUsed: false,
            expiresAt: { gte: now }
          }
        });
        const isDirectMatch = parcel.otpCode === cleanToken && (!parcel.otpExpiresAt || now <= parcel.otpExpiresAt);
        if (!activeOtpRecord && !isDirectMatch) {
          throw new BadRequestError('Invalid or expired OTP code for this parcel. Handover rejected.');
        }
      }

      // Validate QR if token provided
      if (verificationMethod === VerificationMethod.QR && verificationToken) {
        const cleanToken = verificationToken.trim();
        const pickupToken = await tx.pickupToken.findFirst({
          where: {
            token: cleanToken,
            parcelId: parcel.id,
          }
        });
        if (pickupToken?.isUsed) {
          throw new ConflictError('This QR code pass has already been used.');
        }
      }

      const releasedSlotId = parcel.storageSlotId;
      const previousRackName = parcel.storageSlot?.rack?.name || 'Rack A';
      const previousSlotNumber = parcel.storageSlot?.slotNumber ? String(parcel.storageSlot.slotNumber) : 'A04';

      // 2. Mark Parcel COLLECTED and free slot reference, associate handing-over guard
      const updatedParcel = await tx.parcel.update({
        where: { id: parcel.id },
        data: {
          status: ParcelStatus.COLLECTED,
          storageSlotId: null,
          collectedAt: now,
          handedOverByGuardId: resolvedGuardId,
          handedOverAt: now,
        }
      });

      // 3. Mark Delivery COLLECTED / COMPLETED
      const updatedDelivery = await tx.delivery.update({
        where: { id: parcel.deliveryId },
        data: {
          status: DeliveryStatus.COLLECTED,
          completedAt: now,
        }
      });

      // 4. Free storage slot if assigned
      if (releasedSlotId) {
        await storageService.releaseSlot(releasedSlotId, tx);
      }

      // 5. Create Pickup record
      const pickup = await tx.pickup.create({
        data: {
          deliveryId: parcel.deliveryId,
          parcelId: parcel.id,
          studentId: parcel.studentId,
          guardId: resolvedGuardId,
          verificationMethod,
          pickupLocation: 'Main Gate Delivery Hub',
          notes: notes || null,
          verifiedAt: now,
        }
      });

      // 6. Invalidate QR and OTP tokens
      if (verificationToken) {
        await tx.pickupToken.updateMany({
          where: { token: verificationToken },
          data: { isUsed: true, usedAt: now }
        });
      }
      await tx.pickupToken.updateMany({
        where: { parcelId: parcel.id, isUsed: false },
        data: { isUsed: true, usedAt: now }
      });
      await tx.otpToken.updateMany({
        where: { parcelId: parcel.id, isUsed: false },
        data: { isUsed: true, usedAt: now }
      });

      return {
        pickup,
        parcel,
        delivery: updatedDelivery,
        releasedSlotId,
        previousRackName,
        previousSlotNumber,
      };
    });

    // 7. Record tamper-evident Audit Log
    await auditService.log({
      userId: clientMeta?.userId,
      role: 'GUARD',
      action: 'PARCEL_HANDOVER_COMPLETED',
      entity: 'Parcel',
      entityId: transactionResult.parcel.id,
      ipAddress: clientMeta?.ip,
      userAgent: clientMeta?.userAgent,
      metadata: {
        parcelId: transactionResult.parcel.parcelId,
        studentName: transactionResult.parcel.student.name,
        studentRoll: transactionResult.parcel.student.studentId,
        partner: transactionResult.parcel.delivery.deliveryPartner.name,
        verificationMethod,
        releasedSlotId: transactionResult.releasedSlotId,
        handedOverByGuard: actualGuard ? `${actualGuard.name} (${actualGuard.badgeNumber})` : resolvedGuardId,
      }
    });

    // 8. Dispatch WhatsApp Collection Confirmation (Non-blocking)
    notificationService.send({
      studentId: transactionResult.parcel.student.id,
      deliveryId: transactionResult.delivery.id,
      parcelId: transactionResult.parcel.id,
      type: NotificationType.COLLECTION_CONFIRMATION,
      recipientPhone: transactionResult.parcel.student.phone,
      studentName: transactionResult.parcel.student.name,
      partnerName: transactionResult.parcel.delivery.deliveryPartner.name,
      customParcelId: transactionResult.parcel.parcelId,
      rackName: transactionResult.previousRackName,
      slotNumber: transactionResult.previousSlotNumber,
      collectedAt: now,
    });

    // 9. Emit real-time Socket.IO events for live dashboard and rack reflection
    emitSocketEvent('parcel_status_updated', {
      parcelId: transactionResult.parcel.parcelId,
      id: transactionResult.parcel.id,
      status: 'COLLECTED',
      collectedAt: now.toISOString(),
      guard: actualGuard ? { name: actualGuard.name, badgeNumber: actualGuard.badgeNumber } : undefined,
    });

    if (transactionResult.releasedSlotId) {
      emitSocketEvent('storage_updated', {
        slotId: transactionResult.releasedSlotId,
        status: 'AVAILABLE',
      });
    }

    emitSocketEvent('delivery_updated', {
      deliveryId: transactionResult.delivery.id,
      status: 'COLLECTED',
    });

    return {
      success: true,
      message: 'Parcel handover completed successfully',
      parcelId: transactionResult.parcel.parcelId,
      studentName: transactionResult.parcel.student.name,
      collectedAt: now,
      pickupId: transactionResult.pickup.id,
      guard: actualGuard ? { name: actualGuard.name, badgeNumber: actualGuard.badgeNumber } : undefined,
    };
  }
}

export const pickupService = new PickupService();
