import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config';
import { deliveryService } from '../services/delivery.service';
import { NotFoundError } from '../utils/errors';
import { maskPhoneNumber } from '../utils/helpers';
import { Prisma, ParcelStatus } from '@prisma/client';

export async function searchStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const query = String(req.query.q || '').trim();
    const limit = parseInt(String(req.query.limit || '10'), 10);

    const students = await deliveryService.searchStudents(query, limit);

    return res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10), 1), 100);
    const search = String(req.query.search || '').trim();
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { hostel: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { studentId: 'asc' },
        include: {
          _count: {
            select: { deliveries: true, parcels: true, pickups: true }
          },
          parcels: {
            where: { status: ParcelStatus.STORED },
            include: {
              delivery: { include: { deliveryPartner: true } },
              storageSlot: { include: { rack: true } },
            }
          }
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: students.map(s => ({
        id: s.id,
        studentId: s.studentId,
        name: s.name,
        phone: s.phone,
        maskedPhone: maskPhoneNumber(s.phone),
        email: s.email,
        hostel: s.hostel,
        room: s.room,
        department: s.department,
        year: s.year,
        isWhatsAppActive: s.isWhatsAppActive,
        stats: {
          totalDeliveries: s._count.deliveries,
          totalPickups: s._count.pickups,
          activeParcelsCount: s.parcels.length,
        },
        activeParcels: s.parcels.map(p => ({
          id: p.id,
          parcelId: p.parcelId,
          partner: p.delivery.deliveryPartner.name,
          status: p.status,
          slot: p.storageSlot ? `${p.storageSlot.rack.code}${p.storageSlot.slotNumber}` : 'N/A',
          rackName: p.storageSlot?.rack.name,
          slotNumber: p.storageSlot?.slotNumber,
          receivedAt: p.createdAt,
        }))
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

export async function getStudentById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        deliveries: {
          orderBy: { receivedAt: 'desc' },
          include: {
            deliveryPartner: true,
            guard: true,
            parcel: { include: { storageSlot: { include: { rack: true } } } },
            pickups: true,
          }
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        }
      }
    });

    if (!student) throw new NotFoundError('Student not found');

    return res.status(200).json({
      success: true,
      data: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        phone: student.phone,
        maskedPhone: maskPhoneNumber(student.phone),
        email: student.email,
        hostel: student.hostel,
        room: student.room,
        department: student.department,
        year: student.year,
        deliveries: student.deliveries,
        notifications: student.notifications,
      }
    });
  } catch (error) {
    next(error);
  }
}
