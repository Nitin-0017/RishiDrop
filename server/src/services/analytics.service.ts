import { prisma } from '../config';
import { DeliveryStatus, ParcelStatus, SlotStatus } from '@prisma/client';

export class AnalyticsService {
  /**
   * Calculates comprehensive operational parcel delivery metrics from PostgreSQL
   */
  async getDashboardMetrics() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalDeliveries,
      storedParcels,
      collectedDeliveries,
      todayTotal,
      todayStored,
      todayCollected,
      totalSlots,
      occupiedSlots,
      recentDeliveries,
      pickupsWithDuration,
    ] = await Promise.all([
      prisma.delivery.count(),
      prisma.parcel.count({ where: { status: ParcelStatus.STORED } }),
      prisma.delivery.count({ where: { status: DeliveryStatus.COLLECTED } }),

      // Today's metrics
      prisma.delivery.count({ where: { receivedAt: { gte: todayStart } } }),
      prisma.parcel.count({ where: { createdAt: { gte: todayStart }, status: ParcelStatus.STORED } }),
      prisma.delivery.count({ where: { completedAt: { gte: todayStart }, status: DeliveryStatus.COLLECTED } }),

      // Storage
      prisma.storageSlot.count(),
      prisma.storageSlot.count({ where: { status: SlotStatus.OCCUPIED } }),

      // Recent 10 deliveries
      prisma.delivery.findMany({
        take: 10,
        orderBy: { receivedAt: 'desc' },
        include: {
          student: true,
          deliveryPartner: true,
          parcel: { include: { storageSlot: { include: { rack: true } } } },
        }
      }),

      // For average pickup turnaround time
      prisma.delivery.findMany({
        where: {
          status: DeliveryStatus.COLLECTED,
          completedAt: { not: null },
        },
        take: 300,
        select: {
          receivedAt: true,
          completedAt: true,
        }
      })
    ]);

    // Calculate Average Collection Time (Minutes)
    let totalDurationMins = 0;
    let count = 0;

    for (const p of pickupsWithDuration) {
      if (p.completedAt && p.receivedAt) {
        const diffMins = Math.max(0, (p.completedAt.getTime() - p.receivedAt.getTime()) / (1000 * 60));
        totalDurationMins += diffMins;
        count++;
      }
    }

    const avgTurnaround = count > 0 ? Math.round(totalDurationMins / count) : 45;

    // Unclaimed Parcels Aging Breakdown
    const now = new Date();
    const activeStoredParcels = await prisma.parcel.findMany({
      where: { status: ParcelStatus.STORED },
      select: { createdAt: true }
    });

    let unclaimed24h = 0;
    let unclaimed48h = 0;
    let unclaimed72hPlus = 0;

    for (const p of activeStoredParcels) {
      const ageHours = (now.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60);
      if (ageHours >= 72) unclaimed72hPlus++;
      else if (ageHours >= 48) unclaimed48h++;
      else if (ageHours >= 24) unclaimed24h++;
    }

    const storageUtilization = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

    return {
      summary: {
        totalDeliveries,
        storedParcels,
        totalPending: storedParcels,
        collectedDeliveries,
        storageUtilization,
        totalSlots,
        occupiedSlots,
        availableSlots: totalSlots - occupiedSlots,
        avgPickupTimeMinutes: avgTurnaround,
        unclaimed: {
          unclaimed24h,
          unclaimed48h,
          unclaimed72hPlus,
          totalUnclaimed: unclaimed24h + unclaimed48h + unclaimed72hPlus,
        }
      },
      today: {
        total: todayTotal,
        stored: todayStored,
        collected: todayCollected,
        pending: todayTotal - todayCollected,
      },
      recentActivity: recentDeliveries.map(d => ({
        id: d.id,
        deliveryNumber: d.deliveryNumber,
        parcelId: d.parcel?.parcelId || d.deliveryNumber,
        studentName: d.student.name,
        studentRoll: d.student.studentId,
        partner: d.deliveryPartner.name,
        partnerColor: d.deliveryPartner.color,
        status: d.status,
        slot: d.parcel?.storageSlot ? `${d.parcel.storageSlot.rack.code}${d.parcel.storageSlot.slotNumber}` : 'N/A',
        receivedAt: d.receivedAt,
        whatsappStatus: d.parcel?.whatsappStatus || 'QUEUED',
        whatsappError: d.parcel?.whatsappError,
      }))
    };
  }

  /**
   * Trend analytics: 14-day history, peak hours distribution, delivery partner distribution
   */
  async getDetailedAnalytics() {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const [deliveries, partners, guardStats] = await Promise.all([
      prisma.delivery.findMany({
        where: { receivedAt: { gte: fourteenDaysAgo } },
        include: { deliveryPartner: true }
      }),
      prisma.deliveryPartner.findMany({
        include: {
          _count: { select: { deliveries: true } }
        }
      }),
      prisma.guard.findMany({
        include: {
          _count: { select: { deliveries: true, pickups: true } }
        }
      })
    ]);

    // 1. Daily Trends (Past 14 Days)
    const dailyMap = new Map<string, { date: string; total: number; count: number; collected: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyMap.set(key, { date: dateLabel, total: 0, count: 0, collected: 0 });
    }

    // 2. Hourly Arrival Distribution (08:00 to 22:00)
    const hourlyMap: Record<number, { hour: string; count: number }> = {};
    for (let h = 8; h <= 22; h++) {
      const hourLabel = `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`;
      hourlyMap[h] = { hour: hourLabel, count: 0 };
    }

    deliveries.forEach(del => {
      const dayKey = del.receivedAt.toISOString().slice(0, 10);
      if (dailyMap.has(dayKey)) {
        const item = dailyMap.get(dayKey)!;
        item.total++;
        item.count++;
        if (del.status === DeliveryStatus.COLLECTED) item.collected++;
      }

      const hour = del.receivedAt.getHours();
      if (hourlyMap[hour]) {
        hourlyMap[hour].count++;
      }
    });

    // 3. Partner Share Distribution
    const partnerDistribution = partners.map(p => ({
      name: p.name,
      slug: p.slug,
      color: p.color || '#4F46E5',
      count: p._count.deliveries,
    })).filter(p => p.count > 0).sort((a, b) => b.count - a.count);

    return {
      dailyTrends: Array.from(dailyMap.values()),
      hourlyDistribution: Object.values(hourlyMap),
      partnerDistribution,
      guardPerformance: guardStats.map(g => ({
        id: g.id,
        name: g.name,
        badgeNumber: g.badgeNumber,
        deliveriesReceived: g._count.deliveries,
        pickupsProcessed: g._count.pickups,
        totalActions: g._count.deliveries + g._count.pickups,
      })).sort((a, b) => b.totalActions - a.totalActions),
    };
  }
}

export const analyticsService = new AnalyticsService();
