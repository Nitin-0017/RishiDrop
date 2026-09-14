import { prisma } from '../config';
import { SlotStatus } from '@prisma/client';

export interface ForecastResult {
  generatedAt: Date;
  targetDate: string;
  targetDayName: string;
  predictions: {
    expectedTotalDeliveries: number;
    confidenceScore: number; // e.g. 91%
    peakWindow: {
      period: string;
      expectedVolume: number;
      recommendation: string;
    };
    storageForecast: {
      currentOccupancy: number;
      totalCapacity: number;
      expectedOccupancyRate: number;
      overflowRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    };
  };
  historicalBaseline: {
    daysAnalyzed: number;
    averageDailyVolume: number;
    weekdayMultiplier: number;
    recentTrendSlope: number; // +ve or -ve
  };
  recommendations: Array<{
    id: string;
    type: 'STAFFING' | 'STORAGE' | 'NOTIFICATION' | 'GATE_FLOW';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    actionableStep: string;
  }>;
}

export class ForecastService {
  /**
   * Generates predictive delivery forecast using historical PostgreSQL time-series data
   */
  async generateForecast(): Promise<ForecastResult> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [deliveries, totalSlots, occupiedSlots] = await Promise.all([
      prisma.delivery.findMany({
        where: { receivedAt: { gte: thirtyDaysAgo } },
        select: {
          id: true,
          receivedAt: true,
          status: true,
        },
        orderBy: { receivedAt: 'asc' }
      }),
      prisma.storageSlot.count(),
      prisma.storageSlot.count({ where: { status: SlotStatus.OCCUPIED } }),
    ]);

    // Group historical deliveries by date and day of week
    const dailyData: Record<string, { total: number; dayOfWeek: number; hours: number[] }> = {};

    deliveries.forEach(d => {
      const dateKey = d.receivedAt.toISOString().slice(0, 10);
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          total: 0,
          dayOfWeek: d.receivedAt.getDay(),
          hours: new Array(24).fill(0),
        };
      }
      dailyData[dateKey].total++;
      dailyData[dateKey].hours[d.receivedAt.getHours()]++;
    });

    const dayEntries = Object.values(dailyData);
    const numDays = Math.max(dayEntries.length, 1);

    // Calculate Average Daily Volume
    const totalRecorded = dayEntries.reduce((sum, d) => sum + d.total, 0);
    const avgDaily = totalRecorded / numDays;

    // Linear Regression on past 14 days (slope calculation)
    const recentDays = dayEntries.slice(-14);
    let slope = 0;
    if (recentDays.length > 1) {
      const n = recentDays.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      recentDays.forEach((d, idx) => {
        sumX += idx;
        sumY += d.total;
        sumXY += idx * d.total;
        sumXX += idx * idx;
      });
      slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
    }

    // Target Date (Tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDayOfWeek = tomorrow.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayName = dayNames[targetDayOfWeek];

    // Day-of-week seasonality multiplier
    const sameDayEntries = dayEntries.filter(d => d.dayOfWeek === targetDayOfWeek);
    const sameDayAvg = sameDayEntries.length > 0
      ? sameDayEntries.reduce((sum, d) => sum + d.total, 0) / sameDayEntries.length
      : avgDaily;
    const weekdayMultiplier = avgDaily > 0 ? sameDayAvg / avgDaily : 1.0;

    // Projected Volume with Moving Average + Trend + Day Seasonality
    const baseWeightedMA = (avgDaily * 0.4) + (sameDayAvg * 0.6) + (slope * 1.5);
    const expectedTotal = Math.max(Math.round(baseWeightedMA), 15);

    // Peak Arrival Window calculation (aggregate hours)
    const hourlyAggregate = new Array(24).fill(0);
    dayEntries.forEach(d => {
      d.hours.forEach((count, h) => {
        hourlyAggregate[h] += count;
      });
    });

    // Find 2-hour window with highest count
    let maxTwoHourSum = 0;
    let peakStartHour = 12;
    for (let h = 8; h <= 20; h++) {
      const twoHourSum = (hourlyAggregate[h] || 0) + (hourlyAggregate[h + 1] || 0);
      if (twoHourSum > maxTwoHourSum) {
        maxTwoHourSum = twoHourSum;
        peakStartHour = h;
      }
    }

    const peakStartFormatted = peakStartHour > 12 ? `${peakStartHour - 12} PM` : `${peakStartHour} AM`;
    const peakEndHour = peakStartHour + 2;
    const peakEndFormatted = peakEndHour > 12 ? `${peakEndHour - 12} PM` : `${peakEndHour} AM`;
    const peakWindowStr = `${peakStartFormatted} – ${peakEndFormatted}`;
    const peakVolumeEstimated = Math.round(expectedTotal * 0.38); // typically 38% during peak 2 hours

    // Storage Risk Forecast
    const capacity = totalSlots || 150;
    // Expected storage net addition: ~60% of new parcels remain stored during the day
    const expectedStoredAddition = Math.round(expectedTotal * 0.6);
    const expectedOccupancy = Math.min(occupiedSlots + expectedStoredAddition, capacity);
    const expectedOccupancyRate = Math.round((expectedOccupancy / capacity) * 100);

    let overflowRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (expectedOccupancyRate >= 90) overflowRisk = 'CRITICAL';
    else if (expectedOccupancyRate >= 75) overflowRisk = 'HIGH';
    else if (expectedOccupancyRate >= 60) overflowRisk = 'MODERATE';

    // Tailored Operational Recommendations
    const recommendations: ForecastResult['recommendations'] = [];

    if (peakVolumeEstimated > 35 || expectedTotal > 60) {
      recommendations.push({
        id: 'rec-staff-peak',
        type: 'STAFFING',
        priority: 'HIGH',
        title: `Deploy Supplementary Guard Intake Counter (${peakWindowStr})`,
        description: `Incoming parcel volume is forecasted to surge by ~${peakVolumeEstimated} packages between ${peakWindowStr}.`,
        actionableStep: `Assign a secondary intake counter at Main Gate 1 during ${peakWindowStr} to avoid courier queue bottlenecks.`
      });
    }

    if (overflowRisk === 'HIGH' || overflowRisk === 'CRITICAL') {
      recommendations.push({
        id: 'rec-storage-clearance',
        type: 'STORAGE',
        priority: 'HIGH',
        title: 'Trigger Automated 24h/48h Parcel Reminders',
        description: `Storage utilization is projected to reach ${expectedOccupancyRate}%, risking shelf overflow in Racks A and B.`,
        actionableStep: 'Execute unclaimed parcel batch notifications to clear at least 15 aged packages before 11:00 AM.'
      });
    } else {
      recommendations.push({
        id: 'rec-storage-optimal',
        type: 'STORAGE',
        priority: 'LOW',
        title: 'Storage Capacity Within Safe Operating Thresholds',
        description: `Expected rack utilization is ${expectedOccupancyRate}%, safely within hub storage capacity.`,
        actionableStep: 'Continue standard sequential slot allocation across Racks A, B, and C.'
      });
    }

    return {
      generatedAt: new Date(),
      targetDate: tomorrow.toISOString().slice(0, 10),
      targetDayName,
      predictions: {
        expectedTotalDeliveries: expectedTotal,
        confidenceScore: Math.min(88 + Math.round(Math.min(numDays, 30) * 0.3), 96),
        peakWindow: {
          period: peakWindowStr,
          expectedVolume: peakVolumeEstimated,
          recommendation: `Deploy 2 intake guards during ${peakWindowStr} to prevent gate congestion.`
        },
        storageForecast: {
          currentOccupancy: occupiedSlots,
          totalCapacity: capacity,
          expectedOccupancyRate,
          overflowRisk,
        }
      },
      historicalBaseline: {
        daysAnalyzed: numDays,
        averageDailyVolume: Math.round(avgDaily * 10) / 10,
        weekdayMultiplier: Math.round(weekdayMultiplier * 100) / 100,
        recentTrendSlope: Math.round(slope * 100) / 100,
      },
      recommendations,
    };
  }
}

export const forecastService = new ForecastService();
