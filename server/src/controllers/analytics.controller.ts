import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';
import { forecastService } from '../services/forecast.service';

export async function getOverviewMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getDashboardMetrics();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDetailedAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getDetailedAnalytics();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getForecast(req: Request, res: Response, next: NextFunction) {
  try {
    const forecast = await forecastService.generateForecast();
    return res.status(200).json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    next(error);
  }
}
