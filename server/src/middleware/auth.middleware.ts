import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config, prisma } from '../config';
import { UnauthorizedError } from '../utils/errors';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    name: string;
    phone: string;
    studentId?: string;
    guardId?: string;
    adminId?: string;
  };
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Token not found');
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { id: string; role: Role };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        student: true,
        guard: true,
        admin: true,
      }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account not found or disabled');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      studentId: user.student?.id,
      guardId: user.guard?.id,
      adminId: user.admin?.id,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid or expired authentication token'));
    } else {
      next(error);
    }
  }
}
