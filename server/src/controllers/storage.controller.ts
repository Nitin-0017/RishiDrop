import { Request, Response, NextFunction } from 'express';
import { storageService } from '../services/storage.service';
import { SlotStatus } from '@prisma/client';

export async function getStorageOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const overview = await storageService.getStorageOverview();
    return res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
}

export async function createRack(req: Request, res: Response, next: NextFunction) {
  try {
    const rack = await storageService.createRack(req.body);
    return res.status(201).json({
      success: true,
      message: 'Storage rack created successfully.',
      data: rack,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateRack(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const rack = await storageService.updateRack(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Storage rack updated successfully.',
      data: rack,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteRack(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await storageService.deleteRack(id);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}

export async function createSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const slot = await storageService.createSlot(req.body);
    return res.status(201).json({
      success: true,
      message: 'Storage slot created successfully.',
      data: slot,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const slot = await storageService.updateSlot(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Storage slot updated successfully.',
      data: slot,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSlot(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await storageService.deleteSlot(id);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}
