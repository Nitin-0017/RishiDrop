import { prisma } from '../config';
import { ParcelStatus } from '@prisma/client';

export class ReportService {
  /**
   * Generates CSV for Deliveries Ledger
   */
  async generateDeliveriesCsv(startDate?: string, endDate?: string): Promise<string> {
    const where: any = {};
    if (startDate || endDate) {
      where.receivedAt = {};
      if (startDate) where.receivedAt.gte = new Date(startDate);
      if (endDate) where.receivedAt.lte = new Date(endDate);
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      include: {
        student: true,
        guard: true,
        deliveryPartner: true,
        parcel: { include: { storageSlot: { include: { rack: true } } } },
        pickups: { include: { guard: true } },
      }
    });

    const headers = [
      'Delivery Number',
      'Parcel ID',
      'Partner',
      'Tracking Number',
      'Status',
      'Student Name',
      'Student Roll',
      'Student Phone',
      'Hostel',
      'Room',
      'Storage Rack',
      'Storage Slot',
      'Received Guard',
      'Received At',
      'Completed At',
      'Verification Method',
    ];

    const rows = deliveries.map(d => [
      d.deliveryNumber,
      d.parcel?.parcelId || 'N/A',
      d.deliveryPartner.name,
      d.trackingNumber || 'N/A',
      d.status,
      `"${d.student.name}"`,
      d.student.studentId,
      d.student.phone,
      `"${d.student.hostel || ''}"`,
      d.student.room || '',
      d.parcel?.storageSlot?.rack.name || 'N/A',
      d.parcel?.storageSlot?.slotNumber || 'N/A',
      `"${d.guard.name}"`,
      d.receivedAt.toISOString(),
      d.completedAt ? d.completedAt.toISOString() : 'Pending',
      d.pickups.length > 0 ? d.pickups[0].verificationMethod : 'None',
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Generates CSV for Unclaimed Aged Parcels
   */
  async generateUnclaimedParcelsCsv(): Promise<string> {
    const parcels = await prisma.parcel.findMany({
      where: { status: ParcelStatus.STORED },
      orderBy: { createdAt: 'asc' },
      include: {
        student: true,
        delivery: { include: { deliveryPartner: true } },
        storageSlot: { include: { rack: true } },
      }
    });

    const headers = [
      'Parcel ID',
      'Delivery Partner',
      'Storage Rack',
      'Storage Slot',
      'Student Name',
      'Student Roll',
      'Student Phone',
      'Student Email',
      'Hostel Block',
      'Room Number',
      'Received Date',
      'Age (Hours)',
      'Reminder Count',
      'Last Reminded At',
    ];

    const now = new Date();
    const rows = parcels.map(p => {
      const ageHours = Math.round((now.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60));
      return [
        p.parcelId,
        p.delivery.deliveryPartner.name,
        p.storageSlot?.rack.name || 'N/A',
        p.storageSlot?.slotNumber || 'N/A',
        `"${p.student.name}"`,
        p.student.studentId,
        p.student.phone,
        p.student.email,
        `"${p.student.hostel || ''}"`,
        p.student.room || '',
        p.createdAt.toISOString(),
        ageHours,
        p.reminderCount,
        p.lastRemindedAt ? p.lastRemindedAt.toISOString() : 'Never',
      ];
    });

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Generates CSV for Storage Capacity
   */
  async generateStorageReportCsv(): Promise<string> {
    const slots = await prisma.storageSlot.findMany({
      include: {
        rack: true,
        parcels: {
          where: { status: 'STORED' },
          include: {
            student: true,
            delivery: { include: { deliveryPartner: true } }
          }
        }
      },
      orderBy: [{ rack: { code: 'asc' } }, { slotNumber: 'asc' }]
    });

    const headers = [
      'Rack Name',
      'Rack Zone',
      'Slot Number',
      'Slot Status',
      'Assigned Parcel ID',
      'Partner',
      'Student Name',
      'Student Roll',
      'Stored Since',
    ];

    const rows = slots.map(s => {
      const activeParcel = s.parcels && s.parcels.length > 0 ? s.parcels[0] : null;
      return [
        `"${s.rack.name}"`,
        `"${s.rack.zone}"`,
        s.slotNumber,
        s.status,
        activeParcel?.parcelId || 'EMPTY',
        activeParcel?.delivery.deliveryPartner.name || 'N/A',
        activeParcel?.student ? `"${activeParcel.student.name}"` : 'N/A',
        activeParcel?.student?.studentId || 'N/A',
        activeParcel?.createdAt ? activeParcel.createdAt.toISOString() : 'N/A',
      ];
    });

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export const reportService = new ReportService();
