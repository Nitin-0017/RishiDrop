import cron from 'node-cron';
import { prisma } from '../config';
import { notificationService } from '../services/notification/notification.service';
import { logger } from '../utils/logger';
import { ParcelStatus, NotificationType } from '@prisma/client';

export class UnclaimedParcelJob {
  private isRunning = false;

  /**
   * Process aged parcels and send automated reminders
   */
  async processAgedParcels(): Promise<{ processedCount: number; remindersSent: number }> {
    if (this.isRunning) {
      logger.warn('Unclaimed parcel job is already running, skipping overlapping tick');
      return { processedCount: 0, remindersSent: 0 };
    }

    this.isRunning = true;
    let remindersSent = 0;

    try {
      const now = new Date();
      const activeParcels = await prisma.parcel.findMany({
        where: {
          status: ParcelStatus.STORED,
        },
        include: {
          student: true,
          delivery: { include: { deliveryPartner: true } },
          storageSlot: { include: { rack: true } },
        }
      });

      for (const parcel of activeParcels) {
        const ageHours = (now.getTime() - parcel.createdAt.getTime()) / (1000 * 60 * 60);
        const slotDesc = parcel.storageSlot ? `${parcel.storageSlot.rack.name} (Slot ${parcel.storageSlot.slotNumber})` : 'Storage Hub';

        // 72 Hours Alert & Status Escalation
        if (ageHours >= 72 && parcel.reminderCount < 3) {
          await notificationService.send({
            studentId: parcel.student.id,
            deliveryId: parcel.deliveryId,
            parcelId: parcel.id,
            type: NotificationType.ALERT_72H,
            recipientPhone: parcel.student.phone,
            studentName: parcel.student.name,
            partnerName: parcel.delivery.deliveryPartner.name,
            customParcelId: parcel.parcelId,
            slotNumber: slotDesc,
          });

          await prisma.parcel.update({
            where: { id: parcel.id },
            data: {
              status: ParcelStatus.OVERDUE,
              reminderCount: 3,
              lastRemindedAt: now,
            }
          });
          remindersSent++;
        }
        // 48 Hours Second Notice
        else if (ageHours >= 48 && parcel.reminderCount < 2) {
          await notificationService.send({
            studentId: parcel.student.id,
            deliveryId: parcel.deliveryId,
            parcelId: parcel.id,
            type: NotificationType.REMINDER_48H,
            recipientPhone: parcel.student.phone,
            studentName: parcel.student.name,
            partnerName: parcel.delivery.deliveryPartner.name,
            customParcelId: parcel.parcelId,
            slotNumber: slotDesc,
          });

          await prisma.parcel.update({
            where: { id: parcel.id },
            data: {
              reminderCount: 2,
              lastRemindedAt: now,
            }
          });
          remindersSent++;
        }
        // 24 Hours First Reminder
        else if (ageHours >= 24 && parcel.reminderCount < 1) {
          await notificationService.send({
            studentId: parcel.student.id,
            deliveryId: parcel.deliveryId,
            parcelId: parcel.id,
            type: NotificationType.REMINDER_24H,
            recipientPhone: parcel.student.phone,
            studentName: parcel.student.name,
            partnerName: parcel.delivery.deliveryPartner.name,
            customParcelId: parcel.parcelId,
            slotNumber: slotDesc,
          });

          await prisma.parcel.update({
            where: { id: parcel.id },
            data: {
              reminderCount: 1,
              lastRemindedAt: now,
            }
          });
          remindersSent++;
        }
      }

      logger.info(`Unclaimed parcel job completed: checked ${activeParcels.length} parcels, sent ${remindersSent} notifications.`);
      return { processedCount: activeParcels.length, remindersSent };
    } catch (error: any) {
      logger.error('Error during unclaimed parcel cron processing:', error.message);
      return { processedCount: 0, remindersSent };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the recurring cron schedule (Every hour at minute 0)
   */
  startSchedule() {
    logger.info('Initializing Unclaimed Parcel Automated Reminder Cron Schedule (0 * * * *)...');
    cron.schedule('0 * * * *', () => {
      this.processAgedParcels();
    });
  }
}

export const unclaimedParcelJob = new UnclaimedParcelJob();
