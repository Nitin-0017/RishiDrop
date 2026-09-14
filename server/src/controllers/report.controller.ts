import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';

export async function exportDeliveriesCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = req.query;
    const csv = await reportService.generateDeliveriesCsv(startDate as string, endDate as string);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="campusdrop_deliveries_${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}

export async function exportUnclaimedCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await reportService.generateUnclaimedParcelsCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="campusdrop_unclaimed_parcels_${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}

export async function exportStorageCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await reportService.generateStorageReportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="campusdrop_storage_report_${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}
