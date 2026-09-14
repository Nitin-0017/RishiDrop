import { Request, Response, NextFunction } from 'express';
import { guardService } from '../services/guard.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { BadRequestError } from '../utils/errors';

export async function getGuardProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) throw new BadRequestError('User authentication required');
    const profile = await guardService.getGuardProfile(req.user.id);
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateGuardProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) throw new BadRequestError('User authentication required');
    const updated = await guardService.updateGuardProfile(req.user.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllGuards(req: Request, res: Response, next: NextFunction) {
  try {
    const guards = await guardService.getAllGuards();
    return res.status(200).json({
      success: true,
      data: guards,
    });
  } catch (error) {
    next(error);
  }
}

export async function createGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const guard = await guardService.createGuard(req.body);
    return res.status(201).json({
      success: true,
      message: 'Guard added successfully.',
      data: guard,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const guard = await guardService.updateGuard(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Guard updated successfully.',
      data: guard,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await guardService.deleteGuard(id);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleGuardStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const result = await guardService.toggleGuardStatus(id, Boolean(isActive));
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}
