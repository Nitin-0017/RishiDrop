import { Request, Response, NextFunction } from 'express';
import { pickupService } from '../services/pickup.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { BadRequestError } from '../utils/errors';
import { prisma } from '../config';
import { VerificationMethod } from '@prisma/client';

export async function generateQr(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { parcelId } = req.body;
    let studentId = req.user?.studentId;

    if (!studentId) {
      // Find student by parcel if studentId not directly on user
      const parcel = await prisma.parcel.findUnique({ where: { id: parcelId } });
      if (!parcel) throw new BadRequestError('Parcel not found');
      studentId = parcel.studentId;
    }

    const result = await pickupService.generateQrToken(parcelId, studentId);
    return res.status(200).json({
      success: true,
      message: 'Pickup QR pass generated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function generateOtp(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { parcelId } = req.body;
    let studentId = req.user?.studentId;

    if (!studentId) {
      const parcel = await prisma.parcel.findUnique({ where: { id: parcelId } });
      if (!parcel) throw new BadRequestError('Parcel not found');
      studentId = parcel.studentId;
    }

    const result = await pickupService.generateOtp(parcelId, studentId);
    return res.status(200).json({
      success: true,
      message: 'Pickup OTP generated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyQr(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    const clean = (token || '').trim();
    if (clean.startsWith('{') || clean.startsWith('CD-')) {
      const result = await pickupService.verifyParcelQr(clean, req.user?.id);
      return res.status(200).json({
        success: true,
        message: 'Parcel QR validated successfully',
        data: result,
      });
    }
    const result = await pickupService.verifyQrToken(clean);
    return res.status(200).json({
      success: true,
      message: 'QR pass validated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyParcelQr(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { qrData, token } = req.body;
    const input = (qrData || token || '').trim();
    if (!input) {
      throw new BadRequestError('Scanned QR code data is required');
    }
    const guardUserId = req.user?.id;
    const result = await pickupService.verifyParcelQr(input, guardUserId);
    return res.status(200).json({
      success: true,
      message: 'Parcel QR validated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { parcelId, otpCode } = req.body;
    const cleanOtp = (otpCode || parcelId || '').trim();
    const parcelCandidate = otpCode && parcelId && otpCode !== parcelId ? (parcelId || '').trim() : undefined;
    const result = await pickupService.verifyOtp(cleanOtp, parcelCandidate);
    return res.status(200).json({
      success: true,
      message: 'OTP validated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function completeHandover(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { parcelId, verificationMethod, verificationToken, otpCode, notes } = req.body;
    const resolvedToken = (verificationToken || otpCode || '').trim() || null;

    let guardId = req.user?.guardId;
    if (!guardId) {
      const fallbackGuard = await prisma.guard.findFirst();
      if (!fallbackGuard) throw new BadRequestError('No active security guard found');
      guardId = fallbackGuard.id;
    }

    const result = await pickupService.completeHandover(
      parcelId,
      guardId,
      verificationMethod as VerificationMethod,
      resolvedToken,
      notes,
      { ip: req.ip, userAgent: req.headers['user-agent'], userId: req.user?.id }
    );

    return res.status(200).json({
      success: true,
      message: 'Handover completed and parcel marked collected',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function listPickups(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10), 1), 100);
    const skip = (page - 1) * limit;

    const [total, pickups] = await Promise.all([
      prisma.pickup.count(),
      prisma.pickup.findMany({
        skip,
        take: limit,
        orderBy: { verifiedAt: 'desc' },
        include: {
          student: true,
          guard: true,
          parcel: {
            include: {
              delivery: { include: { deliveryPartner: true } }
            }
          }
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: pickups.map(p => ({
        id: p.id,
        parcelId: p.parcel.parcelId,
        partner: p.parcel.delivery.deliveryPartner.name,
        partnerColor: p.parcel.delivery.deliveryPartner.color,
        studentName: p.student.name,
        studentRoll: p.student.studentId,
        guardName: p.guard.name,
        badgeNumber: p.guard.badgeNumber,
        verificationMethod: p.verificationMethod,
        pickupLocation: p.pickupLocation,
        verifiedAt: p.verifiedAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    next(error);
  }
}
