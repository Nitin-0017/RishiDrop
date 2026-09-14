import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config';
import { unclaimedParcelJob } from '../jobs/unclaimed-parcel.job';

export async function getGuards(req: Request, res: Response, next: NextFunction) {
  try {
    const guards = await prisma.guard.findMany({
      include: {
        user: { select: { email: true, isActive: true } },
        _count: {
          select: { deliveries: true, pickups: true }
        }
      },
      orderBy: { badgeNumber: 'asc' }
    });

    return res.status(200).json({
      success: true,
      data: guards.map(g => ({
        id: g.id,
        name: g.name,
        badgeNumber: g.badgeNumber,
        phone: g.phone,
        email: g.user.email,
        gateNumber: g.gateNumber,
        shift: g.shift,
        isActive: g.isActive && g.user.isActive,
        stats: {
          deliveriesReceived: g._count.deliveries,
          pickupsProcessed: g._count.pickups,
        }
      }))
    });
  } catch (error) {
    next(error);
  }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '30'), 10), 1), 100);
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: { select: { name: true, email: true, role: true } }
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
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

export async function triggerUnclaimedJob(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await unclaimedParcelJob.processAgedParcels();
    return res.status(200).json({
      success: true,
      message: 'Unclaimed parcel reminder job triggered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSystemSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' }
    });
    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}
