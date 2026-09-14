import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, config } from '../config';
import { BadRequestError, UnauthorizedError } from '../utils/errors';
import { AuthRequest } from '../middleware/auth.middleware';
import { auditService } from '../services/audit.service';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        student: true,
        guard: true,
        admin: true,
      }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    // Audit log
    await auditService.log({
      userId: user.id,
      role: user.role,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        student: user.student ? {
          id: user.student.id,
          studentId: user.student.studentId,
          hostel: user.student.hostel,
          room: user.student.room,
          department: user.student.department,
        } : null,
        guard: user.guard ? {
          id: user.guard.id,
          badgeNumber: user.guard.badgeNumber,
          gateNumber: user.guard.gateNumber,
          shift: user.guard.shift,
        } : null,
        admin: user.admin ? {
          id: user.admin.id,
          department: user.admin.department,
        } : null,
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        student: true,
        guard: true,
        admin: true,
      }
    });

    if (!user) throw new UnauthorizedError('User not found');

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        student: user.student,
        guard: user.guard,
        admin: user.admin,
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getDemoAccounts(req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    accounts: [
      {
        role: 'STUDENT',
        label: 'Student Portal (Manjeet Sharma)',
        email: 'student@campusdrop.demo',
        password: 'CampusDrop@2026',
        description: '3rd Year Computer Science • Roll CS2023-0142 • Aravali Hostel B-304'
      },
      {
        role: 'GUARD',
        label: 'Security Guard Tablet (Rajesh Kumar)',
        email: 'guard@campusdrop.demo',
        password: 'CampusDrop@2026',
        description: 'Badge GD-001 • Main Gate 1 • Morning Shift'
      },
      {
        role: 'ADMIN',
        label: 'Campus Admin Command Center',
        email: 'admin@campusdrop.demo',
        password: 'CampusDrop@2026',
        description: 'Logistics Operations Director • Full System Access'
      }
    ]
  });
}
