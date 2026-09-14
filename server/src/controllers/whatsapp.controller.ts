import { Request, Response, NextFunction } from 'express';
import { verifyWebhook, handleIncomingWebhook } from '../services/whatsapp/whatsapp.webhook';
import { whatsAppBotService } from '../services/whatsapp/whatsapp.bot';
import { prisma } from '../config';

export async function webhookGet(req: Request, res: Response) {
  return verifyWebhook(req, res);
}

export async function webhookPost(req: Request, res: Response) {
  return handleIncomingWebhook(req, res);
}

export async function simulateIncoming(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, phone, message, text } = req.body;
    const fromPhone = (from || phone || '').trim();
    const rawInput = (message || text || '').trim();

    if (!fromPhone || !rawInput) {
      return res.status(400).json({
        success: false,
        error: 'Both phone and message/text are required',
      });
    }

    // 1. Record inbound message
    try {
      await prisma.whatsAppMessage.create({
        data: {
          fromPhone,
          toPhone: 'CampusDrop_Hub',
          direction: 'INBOUND',
          messageType: 'text',
          payload: { text: rawInput },
          status: 'received',
        }
      });
    } catch (e) {}

    // 2. Process command via single centralized bot service
    const result = await whatsAppBotService.processCommand(fromPhone, rawInput);

    return res.status(200).json({
      success: true,
      data: {
        messageId: result.messageId,
        reply: result.replyText,
        qrData: result.qrData,
        qrPayload: result.qrPayload,
        otp: result.otp,
        parcelId: result.parcelId,
        role: result.role,
        user: result.user,
        student: result.student || result.user,
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getResolvedAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const phone = String(req.query.phone || '').trim();
    const { resolveAccount } = await import('../services/whatsapp/whatsapp.bot');
    const account = await resolveAccount(phone);

    return res.status(200).json({
      success: true,
      data: {
        role: account.role,
        displayName: account.displayName,
        identifier: account.identifier,
        phone: account.phone,
        digits10: account.digits10,
        errorType: account.errorType,
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getWhatsAppMessageLog(req: Request, res: Response, next: NextFunction) {
  try {
    const phone = req.query.phone ? String(req.query.phone) : undefined;
    const where: any = {};
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      where.OR = [
        { fromPhone: { contains: cleanPhone } },
        { toPhone: { contains: cleanPhone } },
        { fromPhone: { contains: phone } },
        { toPhone: { contains: phone } },
      ];
    }

    const messages = await prisma.whatsAppMessage.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
}
