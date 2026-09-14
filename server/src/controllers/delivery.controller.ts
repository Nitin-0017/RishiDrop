import { Request, Response, NextFunction } from 'express';
import { deliveryService } from '../services/delivery.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { prisma } from '../config';

export async function createDelivery(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { studentId, deliveryPartnerId, storageType, rackId, slotId, trackingNumber, notes } = req.body;

    // Use logged-in guard ID, or fallback to first active guard if demo
    let guardId = req.user?.guardId;
    if (!guardId) {
      const fallbackGuard = await prisma.guard.findFirst();
      if (!fallbackGuard) throw new BadRequestError('No active security guard found in system');
      guardId = fallbackGuard.id;
    }

    const result = await deliveryService.createDelivery(
      { studentId, deliveryPartnerId, storageType, rackId, slotId, trackingNumber, notes },
      guardId,
      { ip: req.ip, userAgent: req.headers['user-agent'], userId: req.user?.id }
    );

    return res.status(201).json({
      success: true,
      message: 'Parcel received and stored successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getNextOversizedRef(req: Request, res: Response, next: NextFunction) {
  try {
    const reference = await deliveryService.getNextOversizedRef();
    return res.status(200).json({
      success: true,
      data: {
        reference,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDeliveries(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await deliveryService.getDeliveries(req.query as any);
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getParcelDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parcel = await deliveryService.getParcelDetails(id);
    return res.status(200).json({
      success: true,
      data: parcel,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDeliveryById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        student: true,
        guard: true,
        deliveryPartner: true,
        parcel: {
          include: {
            storageSlot: { include: { rack: true } },
            pickups: { include: { guard: true } },
            notifications: true,
          }
        },
        pickups: { include: { guard: true } },
        notifications: true,
      }
    });

    if (!delivery) throw new NotFoundError('Delivery not found');

    return res.status(200).json({
      success: true,
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDeliveryPartners(req: Request, res: Response, next: NextFunction) {
  try {
    const partners = await deliveryService.getDeliveryPartners();
    return res.status(200).json({
      success: true,
      data: partners,
    });
  } catch (error) {
    next(error);
  }
}
