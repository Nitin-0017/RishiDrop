import { Request, Response } from 'express';
import { config, prisma } from '../../config';
import { logger } from '../../utils/logger';
import { whatsappService } from './whatsapp.service';
import { whatsAppBotService } from './whatsapp.bot';
import { whatsappTemplates } from './whatsapp.templates';
import { normalizePhone } from '../../utils/helpers';
import { emitSocketEvent } from '../../utils/socketEmitter';
import { ParcelStatus, NotificationStatus } from '@prisma/client';

/**
 * Meta Webhook Challenge Verification (GET /api/whatsapp/webhook)
 */
export async function verifyWebhook(req: Request, res: Response) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
      logger.info('Meta WhatsApp Webhook verified successfully');
      return res.status(200).send(challenge);
    } else {
      logger.warn('Meta WhatsApp Webhook verification failed - token mismatch');
      return res.sendStatus(403);
    }
  }

  return res.sendStatus(400);
}

/**
 * Process Meta WhatsApp Cloud API Webhook Event (POST /api/whatsapp/webhook)
 */
export async function handleIncomingWebhook(req: Request, res: Response) {
  try {
    const body = req.body;

    // Fast 200 OK ACK for Meta Webhooks
    res.status(200).json({ status: 'EVENT_RECEIVED' });

    // 1. Check for Status Updates (sent -> delivered -> read -> failed)
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0]?.value;

    if (change?.statuses && change.statuses.length > 0) {
      for (const statusObj of change.statuses) {
        await processStatusUpdate(statusObj);
      }
      return;
    }

    // 2. Check for Incoming Message (Meta Cloud API or Test simulator payload)
    let fromPhone = '';
    let messageText = '';
    let rawPayload = body;
    let incomingMessageId = '';

    if (change?.messages && change.messages.length > 0) {
      const message = change.messages[0];
      incomingMessageId = message.id || '';
      fromPhone = normalizePhone(message.from || '');
      if (message.type === 'text') {
        messageText = message.text?.body?.trim() || '';
      } else if (message.type === 'interactive') {
        messageText = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || message.interactive?.button_reply?.id || '';
      } else if (message.type === 'button') {
        messageText = message.button?.text || message.button?.payload || '';
      }
    } else if (body.phone || body.from) {
      // Direct development / testing simulated payload
      fromPhone = normalizePhone(body.phone || body.from || '');
      messageText = (body.text || body.message || '').trim();
      incomingMessageId = body.messageId || body.id || '';
    }

    if (!fromPhone || !messageText) {
      logger.debug('Webhook received without processable incoming message or status event');
      return;
    }

    // Deduplication check: ignore if this exact incoming webhook event was already processed
    if (incomingMessageId) {
      const existing = await prisma.whatsAppMessage.findFirst({
        where: { messageId: incomingMessageId },
      });
      if (existing) {
        logger.warn(`[WEBHOOK DEDUPLICATION] Webhook message ${incomingMessageId} already processed. Ignoring duplicate.`);
        return;
      }
    }

    logger.info(`Received WhatsApp message from ${fromPhone}: "${messageText}"`);

    // Record incoming message in PostgreSQL
    try {
      await prisma.whatsAppMessage.create({
        data: {
          messageId: incomingMessageId || undefined,
          fromPhone,
          toPhone: 'CampusDrop_Hub',
          direction: 'INBOUND',
          messageType: 'text',
          payload: { text: messageText },
          rawPayload: rawPayload as any,
          status: 'received',
        }
      });
    } catch (err) {
      logger.warn('Could not record inbound message in DB:', err);
    }

    // 3. Process Command via Centralized Bot Service
    await whatsAppBotService.processCommand(fromPhone, messageText);

  } catch (error: any) {
    logger.error('WhatsApp webhook processing error:', error);
  }
}

/**
 * Process Meta Status Events (sent, delivered, read, failed)
 */
async function processStatusUpdate(statusObj: any) {
  const messageId = statusObj.id;
  const rawStatus = (statusObj.status || '').toLowerCase(); // sent, delivered, read, failed
  const errorMsg = statusObj.errors?.[0]?.message || statusObj.errors?.[0]?.title;

  logger.info(`[WHATSAPP WEBHOOK STATUS] Message ${messageId} -> ${rawStatus.toUpperCase()}`);

  const statusMap: Record<string, NotificationStatus> = {
    sent: NotificationStatus.SENT,
    delivered: NotificationStatus.DELIVERED,
    read: NotificationStatus.READ,
    failed: NotificationStatus.FAILED,
  };

  const mappedStatus = statusMap[rawStatus] || NotificationStatus.SENT;

  try {
    // 1. Update WhatsAppMessage record
    await prisma.whatsAppMessage.updateMany({
      where: { messageId },
      data: { status: rawStatus },
    });

    // 2. Update Notification record
    await prisma.notification.updateMany({
      where: { providerMessageId: messageId },
      data: {
        status: mappedStatus,
        errorMessage: errorMsg,
      },
    });

    // 3. Update Parcel record linked to this messageId
    const updatedParcels = await prisma.parcel.findMany({
      where: { whatsappMessageId: messageId },
      select: { id: true, parcelId: true }
    });

    if (updatedParcels.length > 0) {
      await prisma.parcel.updateMany({
        where: { whatsappMessageId: messageId },
        data: {
          whatsappStatus: mappedStatus,
          whatsappError: errorMsg,
          whatsappLastUpdatedAt: new Date(),
        }
      });
    }

    // 4. Emit Socket.IO event for real-time frontend status badge updates
    emitSocketEvent('parcel_whatsapp_updated', {
      messageId,
      parcelId: updatedParcels[0]?.id,
      customParcelId: updatedParcels[0]?.parcelId,
      status: mappedStatus,
      error: errorMsg,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    logger.error('Error updating webhook status in database:', err);
  }
}

/**
 * Development testing endpoint to simulate incoming WhatsApp message directly
 * POST /api/whatsapp/simulate-incoming
 */
export async function simulateIncoming(req: Request, res: Response) {
  const { phone, text, from, message } = req.body;
  const senderPhone = phone || from;
  const content = text || message;

  if (!senderPhone || !content) {
    return res.status(400).json({
      success: false,
      error: 'Please provide phone (e.g. "9876543210") and text (e.g. "Hi" or "1")',
    });
  }

  // Route directly to handleIncomingWebhook
  req.body = { phone: senderPhone, text: content };
  await handleIncomingWebhook(req, res);
}
