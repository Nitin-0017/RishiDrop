import { prisma } from '../../config';
import { whatsappService } from '../whatsapp/whatsapp.service';
import { whatsappTemplates } from '../whatsapp/whatsapp.templates';
import { logger } from '../../utils/logger';
import { emitSocketEvent } from '../../utils/socketEmitter';
import { NotificationChannel, NotificationType, NotificationStatus } from '@prisma/client';

export interface SendNotificationParams {
  studentId: string;
  deliveryId?: string;
  parcelId?: string;
  type: NotificationType;
  recipientPhone: string;
  studentName: string;
  partnerName?: string;
  customParcelId?: string;
  trackingNumber?: string | null;
  rackName?: string;
  slotNumber?: string;
  token?: string;
  otpCode?: string;
  collectedAt?: Date;
}

export class NotificationService {
  /**
   * Dispatches a notification across configured channels (WhatsApp first)
   */
  async send(params: SendNotificationParams): Promise<void> {
    try {
      let messageBody = '';

      switch (params.type) {
        case NotificationType.ARRIVAL_NORMAL:
          messageBody = whatsappTemplates.arrivalNormal(
            params.studentName,
            params.partnerName || 'Courier',
            params.customParcelId || 'N/A',
            params.rackName || 'Main Storage',
            params.slotNumber || 'A01',
            params.collectedAt || new Date()
          );
          break;

        case NotificationType.PICKUP_QR:
          messageBody = whatsappTemplates.pickupQrMessage(
            params.studentName,
            params.customParcelId || 'N/A',
            `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?token=${params.token}`,
            params.token || ''
          );
          break;

        case NotificationType.OTP_ALERT:
          messageBody = whatsappTemplates.otpAlertMessage(
            params.studentName,
            params.customParcelId || 'N/A',
            params.otpCode || ''
          );
          break;

        case NotificationType.COLLECTION_CONFIRMATION:
          messageBody = whatsappTemplates.collectionConfirmation(
            params.studentName,
            params.partnerName || 'Parcel',
            params.customParcelId,
            params.rackName,
            params.slotNumber,
            params.collectedAt || new Date()
          );
          break;

        case NotificationType.REMINDER_24H:
          messageBody = whatsappTemplates.reminder24h(
            params.studentName,
            params.partnerName || 'Parcel',
            params.customParcelId || 'N/A',
            params.slotNumber || 'Storage'
          );
          break;

        case NotificationType.REMINDER_48H:
          messageBody = whatsappTemplates.reminder48h(
            params.studentName,
            params.partnerName || 'Parcel',
            params.customParcelId || 'N/A',
            params.slotNumber || 'Storage'
          );
          break;

        case NotificationType.ALERT_72H:
          messageBody = whatsappTemplates.alert72h(
            params.studentName,
            params.partnerName || 'Parcel',
            params.customParcelId || 'N/A',
            params.slotNumber || 'Storage'
          );
          break;

        default:
          messageBody = `Notification for parcel ${params.customParcelId || ''}`;
      }

      // 1. Record in database as QUEUED
      const notifRecord = await prisma.notification.create({
        data: {
          studentId: params.studentId,
          deliveryId: params.deliveryId,
          parcelId: params.parcelId,
          channel: NotificationChannel.WHATSAPP,
          type: params.type,
          recipientPhone: params.recipientPhone,
          messageBody,
          status: NotificationStatus.QUEUED,
        }
      });

      // 2. Dispatch through WhatsApp
      const result = await whatsappService.sendMessage(params.recipientPhone, messageBody, {
        parcelId: params.parcelId,
        studentId: params.studentId,
      });

      const finalStatus = result.success ? NotificationStatus.SENT : NotificationStatus.FAILED;

      // 3. Update Notification record with provider status
      await prisma.notification.updateMany({
        where: { id: notifRecord.id },
        data: {
          status: finalStatus,
          providerMessageId: result.messageId,
          errorMessage: result.error,
          sentAt: result.success ? new Date() : undefined,
        }
      });

      // 4. Update Parcel record
      if (params.parcelId) {
        await prisma.parcel.updateMany({
          where: { id: params.parcelId },
          data: {
            whatsappMessageId: result.messageId,
            whatsappStatus: finalStatus,
            whatsappError: result.error || null,
            whatsappLastUpdatedAt: new Date(),
          }
        });
      }

      // 5. Emit Socket.IO event for real-time dashboard reflection
      emitSocketEvent('parcel_whatsapp_updated', {
        messageId: result.messageId,
        parcelId: params.parcelId,
        customParcelId: params.customParcelId,
        status: finalStatus,
        error: result.error,
        timestamp: new Date().toISOString(),
      });

    } catch (error: any) {
      // Resilience: WhatsApp failure should NOT crash delivery workflows
      logger.error('Failed to dispatch notification:', error.message);
    }
  }
}

export const notificationService = new NotificationService();
