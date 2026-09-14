import { prisma } from '../config';
import bcrypt from 'bcryptjs';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { auditService } from './audit.service';
import { Role } from '@prisma/client';

export class GuardService {
  /**
   * Get logged-in Guard Profile
   */
  async getGuardProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        guard: true,
      }
    });

    if (!user || !user.guard) {
      throw new NotFoundError('Guard profile not found');
    }

    return {
      id: user.guard.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      badgeNumber: user.guard.badgeNumber,
      gateNumber: user.guard.gateNumber,
      shift: user.guard.shift,
      profilePhoto: user.guard.profilePhoto || user.avatar,
      isActive: user.guard.isActive && user.isActive,
      createdAt: user.guard.createdAt,
      joinedDate: user.guard.createdAt,
    };
  }

  /**
   * Guard edits their own profile (Name, Phone, Email, Profile Photo, Password)
   * Guard CANNOT edit BadgeNumber, Gate, Shift, Status.
   */
  async updateGuardProfile(userId: string, data: {
    name?: string;
    phone?: string;
    email?: string;
    profilePhoto?: string | null;
    currentPassword?: string;
    newPassword?: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { guard: true }
    });

    if (!user || !user.guard) {
      throw new NotFoundError('Guard account not found');
    }

    // Check unique email if changed
    if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
      });
      if (existingEmail) {
        throw new ConflictError('This email is already in use by another account.');
      }
    }

    // Check unique phone if changed
    if (data.phone && data.phone !== user.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: data.phone }
      });
      if (existingPhone) {
        throw new ConflictError('This phone number is already registered to another account.');
      }
    }

    let updatedPasswordHash = user.passwordHash;
    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new BadRequestError('Please provide your current password to set a new password.');
      }
      const isMatch = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new BadRequestError('Current password is incorrect.');
      }
      updatedPasswordHash = await bcrypt.hash(data.newPassword, 10);
    }

    // Update User and Guard in transaction
    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          name: data.name ? data.name.trim() : undefined,
          email: data.email ? data.email.toLowerCase().trim() : undefined,
          phone: data.phone ? data.phone.trim() : undefined,
          avatar: data.profilePhoto !== undefined ? data.profilePhoto : undefined,
          passwordHash: updatedPasswordHash,
        }
      });

      const updatedGuard = await tx.guard.update({
        where: { id: user.guard!.id },
        data: {
          name: data.name ? data.name.trim() : undefined,
          phone: data.phone ? data.phone.trim() : undefined,
          profilePhoto: data.profilePhoto !== undefined ? data.profilePhoto : undefined,
        }
      });

      return { updatedUser, updatedGuard };
    });

    return {
      id: updated.updatedGuard.id,
      userId: updated.updatedUser.id,
      name: updated.updatedUser.name,
      email: updated.updatedUser.email,
      phone: updated.updatedUser.phone,
      badgeNumber: updated.updatedGuard.badgeNumber,
      gateNumber: updated.updatedGuard.gateNumber,
      shift: updated.updatedGuard.shift,
      profilePhoto: updated.updatedGuard.profilePhoto,
      isActive: updated.updatedGuard.isActive,
      joinedDate: updated.updatedGuard.createdAt,
    };
  }

  /**
   * Admin: Get all guards with shift & delivery metrics
   */
  async getAllGuards() {
    const guards = await prisma.guard.findMany({
      include: {
        user: true,
        _count: {
          select: {
            deliveries: true,
            pickups: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return guards.map(g => ({
      id: g.id,
      userId: g.userId,
      name: g.name,
      badgeNumber: g.badgeNumber,
      phone: g.phone,
      email: g.user.email,
      gateNumber: g.gateNumber,
      shift: g.shift,
      profilePhoto: g.profilePhoto || g.user.avatar,
      isActive: g.isActive && g.user.isActive,
      joinedDate: g.createdAt,
      totalDeliveries: g._count.deliveries,
      totalPickups: g._count.pickups,
    }));
  }

  /**
   * Admin: Add a new Guard
   */
  async createGuard(data: {
    name: string;
    badgeNumber: string;
    phone: string;
    email: string;
    password: string;
    gateNumber: string;
    shift: string;
    profilePhoto?: string | null;
    isActive?: boolean;
  }) {
    const email = data.email.toLowerCase().trim();
    const badgeNumber = data.badgeNumber.toUpperCase().trim();
    const phone = data.phone.trim();

    // Check unique email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new ConflictError('A user with this email already exists.');

    // Check unique phone
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) throw new ConflictError('A user with this phone number already exists.');

    // Check unique badge
    const existingBadge = await prisma.guard.findUnique({ where: { badgeNumber } });
    if (existingBadge) throw new ConflictError(`Guard ID ${badgeNumber} is already assigned.`);

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name.trim(),
          email,
          phone,
          passwordHash,
          role: Role.GUARD,
          avatar: data.profilePhoto || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
        }
      });

      const guard = await tx.guard.create({
        data: {
          userId: user.id,
          name: data.name.trim(),
          badgeNumber,
          phone,
          gateNumber: data.gateNumber.trim(),
          shift: data.shift.trim(),
          profilePhoto: data.profilePhoto || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
        }
      });

      return { user, guard };
    });

    return {
      id: result.guard.id,
      name: result.guard.name,
      badgeNumber: result.guard.badgeNumber,
      phone: result.guard.phone,
      email: result.user.email,
      gateNumber: result.guard.gateNumber,
      shift: result.guard.shift,
      status: result.guard.isActive ? 'Active' : 'Inactive',
    };
  }

  /**
   * Admin: Update Guard details (including Gate, Shift, and Status)
   */
  async updateGuard(guardId: string, data: {
    name?: string;
    badgeNumber?: string;
    phone?: string;
    email?: string;
    password?: string;
    gateNumber?: string;
    shift?: string;
    profilePhoto?: string | null;
    isActive?: boolean;
  }) {
    const guard = await prisma.guard.findUnique({
      where: { id: guardId },
      include: { user: true }
    });

    if (!guard) throw new NotFoundError('Guard not found');

    if (data.email && data.email.toLowerCase() !== guard.user.email.toLowerCase()) {
      const existingEmail = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
      if (existingEmail) throw new ConflictError('Email is already in use by another user.');
    }

    if (data.badgeNumber && data.badgeNumber.toUpperCase() !== guard.badgeNumber.toUpperCase()) {
      const existingBadge = await prisma.guard.findUnique({ where: { badgeNumber: data.badgeNumber.toUpperCase() } });
      if (existingBadge) throw new ConflictError('Guard ID is already in use.');
    }

    let passwordHash = undefined;
    if (data.password) {
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: guard.userId },
        data: {
          name: data.name ? data.name.trim() : undefined,
          email: data.email ? data.email.toLowerCase().trim() : undefined,
          phone: data.phone ? data.phone.trim() : undefined,
          passwordHash,
          avatar: data.profilePhoto !== undefined ? data.profilePhoto : undefined,
          isActive: data.isActive !== undefined ? data.isActive : undefined,
        }
      });

      const updatedGuard = await tx.guard.update({
        where: { id: guardId },
        data: {
          name: data.name ? data.name.trim() : undefined,
          badgeNumber: data.badgeNumber ? data.badgeNumber.toUpperCase().trim() : undefined,
          phone: data.phone ? data.phone.trim() : undefined,
          gateNumber: data.gateNumber ? data.gateNumber.trim() : undefined,
          shift: data.shift ? data.shift.trim() : undefined,
          profilePhoto: data.profilePhoto !== undefined ? data.profilePhoto : undefined,
          isActive: data.isActive !== undefined ? data.isActive : undefined,
        }
      });

      return { updatedUser, updatedGuard };
    });

    return {
      id: updated.updatedGuard.id,
      name: updated.updatedGuard.name,
      badgeNumber: updated.updatedGuard.badgeNumber,
      phone: updated.updatedGuard.phone,
      email: updated.updatedUser.email,
      gateNumber: updated.updatedGuard.gateNumber,
      shift: updated.updatedGuard.shift,
      isActive: updated.updatedGuard.isActive,
    };
  }

  /**
   * Admin: Deactivate / Soft-delete Guard
   * Preserves historical delivery and pickup records.
   */
  async deleteGuard(guardId: string) {
    const guard = await prisma.guard.findUnique({ where: { id: guardId } });
    if (!guard) throw new NotFoundError('Guard not found');

    // Soft delete / deactivate to protect historical audit trail
    await prisma.$transaction([
      prisma.guard.update({
        where: { id: guardId },
        data: { isActive: false }
      }),
      prisma.user.update({
        where: { id: guard.userId },
        data: { isActive: false }
      })
    ]);

    return { message: `Guard ${guard.name} removed successfully.` };
  }

  /**
   * Admin: Toggle Guard status
   */
  async toggleGuardStatus(guardId: string, isActive: boolean) {
    const guard = await prisma.guard.findUnique({ where: { id: guardId } });
    if (!guard) throw new NotFoundError('Guard not found');

    await prisma.$transaction([
      prisma.guard.update({
        where: { id: guardId },
        data: { isActive }
      }),
      prisma.user.update({
        where: { id: guard.userId },
        data: { isActive }
      })
    ]);

    return { message: `Guard status updated to ${isActive ? 'Active' : 'Inactive'}.` };
  }
}

export const guardService = new GuardService();
