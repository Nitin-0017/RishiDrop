import { prisma } from '../../config';
import { logger } from '../../utils/logger';
import { whatsappService } from './whatsapp.service';
import { pickupService } from '../pickup.service';
import { ParcelStatus } from '@prisma/client';

export interface BotCommandResult {
  messageId?: string;
  replyText: string;
  qrData?: string;
  qrPayload?: string;
  otp?: string;
  parcelId?: string;
  role?: 'STUDENT' | 'GUARD' | 'ADMIN' | 'UNREGISTERED';
  user?: {
    id: string;
    name: string;
    identifier: string;
    phone: string;
    role: string;
  };
  student?: {
    id: string;
    name: string;
    studentId: string;
    phone: string;
  };
}

export interface BotSession {
  phoneKey: string;
  role: 'STUDENT' | 'GUARD' | 'ADMIN';
  entityId: string;
  pendingAction?: 'AWAITING_PARCEL_FOR_QR' | 'AWAITING_PARCEL_FOR_OTP' | null;
  activeParcelIds?: string[];
  lastInteraction: number;
}

class BotSessionManager {
  private sessions = new Map<string, BotSession>();

  getSession(phoneKey: string): BotSession | undefined {
    const session = this.sessions.get(phoneKey);
    if (!session) return undefined;
    // 30 minute idle timeout
    if (Date.now() - session.lastInteraction > 30 * 60 * 1000) {
      this.sessions.delete(phoneKey);
      return undefined;
    }
    return session;
  }

  setSession(phoneKey: string, data: {
    role: 'STUDENT' | 'GUARD' | 'ADMIN';
    entityId: string;
    pendingAction?: 'AWAITING_PARCEL_FOR_QR' | 'AWAITING_PARCEL_FOR_OTP' | null;
    activeParcelIds?: string[];
  }) {
    const existing = this.getSession(phoneKey);
    this.sessions.set(phoneKey, {
      phoneKey,
      role: data.role,
      entityId: data.entityId,
      pendingAction: data.pendingAction !== undefined ? data.pendingAction : existing?.pendingAction,
      activeParcelIds: data.activeParcelIds !== undefined ? data.activeParcelIds : existing?.activeParcelIds,
      lastInteraction: Date.now(),
    });
  }

  clearAction(phoneKey: string) {
    const session = this.getSession(phoneKey);
    if (session) {
      session.pendingAction = null;
      session.lastInteraction = Date.now();
    }
  }

  reset(phoneKey: string) {
    this.sessions.delete(phoneKey);
  }
}

export const botSessionManager = new BotSessionManager();

/**
 * Normalizes WhatsApp phone number into standard 10-digit Indian mobile and generates
 * all plausible database representation candidates for robust lookup.
 */
export function normalizePhone(rawPhone: string): {
  digits10: string;
  formattedE164: string;
  candidateList: string[];
  isValid: boolean;
} {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { digits10: '', formattedE164: '', candidateList: [], isValid: false };
  }

  const digitsOnly = rawPhone.replace(/\D/g, '');
  let digits10 = '';
  if (digitsOnly.length === 10) {
    digits10 = digitsOnly;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    digits10 = digitsOnly.slice(1);
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    digits10 = digitsOnly.slice(2);
  } else if (digitsOnly.length > 10) {
    digits10 = digitsOnly.slice(-10);
  }

  const isValid = digits10.length === 10;
  const formattedE164 = isValid ? `+91${digits10}` : '';

  const set = new Set<string>();
  const trimmed = rawPhone.trim();
  if (trimmed) set.add(trimmed);

  if (digits10) {
    set.add(digits10);
    set.add(`+91${digits10}`);
    set.add(`91${digits10}`);
    set.add(`+91 ${digits10}`);
    set.add(`0${digits10}`);
    set.add(`+91-${digits10}`);
    set.add(`91-${digits10}`);
  }

  return {
    digits10,
    formattedE164,
    candidateList: Array.from(set),
    isValid,
  };
}

/**
 * Resolves account entity across Students, Guards, and Users.
 */
export async function resolveAccount(fromPhone: string): Promise<{
  role: 'STUDENT' | 'GUARD' | 'ADMIN' | 'UNREGISTERED';
  displayName: string;
  identifier: string;
  phone: string;
  digits10: string;
  errorType?: 'INVALID_FORMAT' | 'NOT_REGISTERED';
  student?: any;
  guard?: any;
  user?: any;
}> {
  const norm = normalizePhone(fromPhone);

  if (!norm.isValid && (!norm.digits10 || norm.digits10.length < 5)) {
    return {
      role: 'UNREGISTERED',
      displayName: 'Unknown',
      identifier: 'N/A',
      phone: fromPhone,
      digits10: norm.digits10,
      errorType: 'INVALID_FORMAT',
    };
  }

  const candidates = norm.candidateList;

  // 1. Search Student
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { phone: { in: candidates } },
        ...(norm.digits10 ? [{ phone: { contains: norm.digits10 } }] : []),
      ]
    },
    include: {
      parcels: {
        include: {
          delivery: {
            include: {
              deliveryPartner: true,
              guard: true,
            }
          },
          storageSlot: {
            include: {
              rack: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (student) {
    return {
      role: 'STUDENT',
      displayName: student.name,
      identifier: student.studentId,
      phone: student.phone,
      digits10: norm.digits10 || student.phone,
      student,
    };
  }

  // 2. Search Guard & Guard's linked User
  const guard = await prisma.guard.findFirst({
    where: {
      OR: [
        { phone: { in: candidates } },
        ...(norm.digits10 ? [{ phone: { contains: norm.digits10 } }] : []),
        { user: { phone: { in: candidates } } },
        ...(norm.digits10 ? [{ user: { phone: { contains: norm.digits10 } } }] : []),
      ]
    },
    include: {
      user: true,
      deliveries: {
        include: {
          deliveryPartner: true,
          student: true,
          parcel: {
            include: {
              storageSlot: {
                include: {
                  rack: true,
                }
              }
            }
          }
        },
        orderBy: { receivedAt: 'desc' },
        take: 10,
      }
    }
  });

  if (guard) {
    return {
      role: 'GUARD',
      displayName: guard.name,
      identifier: guard.badgeNumber,
      phone: guard.phone,
      digits10: norm.digits10 || guard.phone,
      guard,
    };
  }

  // 3. Search User table (Admin or general Guard)
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: { in: candidates } },
        ...(norm.digits10 ? [{ phone: { contains: norm.digits10 } }] : []),
      ]
    },
    include: {
      guard: true,
      admin: true,
    }
  });

  if (user) {
    if (user.role === 'GUARD') {
      const guardRecord = user.guard || await prisma.guard.findFirst({ where: { userId: user.id } });
      return {
        role: 'GUARD',
        displayName: user.name,
        identifier: guardRecord?.badgeNumber || 'GD-001',
        phone: user.phone,
        digits10: norm.digits10 || user.phone,
        guard: guardRecord,
      };
    }
    if (user.role === 'ADMIN') {
      return {
        role: 'ADMIN',
        displayName: user.name,
        identifier: 'Campus Admin',
        phone: user.phone,
        digits10: norm.digits10 || user.phone,
        user,
      };
    }
  }

  return {
    role: 'UNREGISTERED',
    displayName: 'Unregistered User',
    identifier: 'N/A',
    phone: fromPhone,
    digits10: norm.digits10,
    errorType: 'NOT_REGISTERED',
  };
}

export class WhatsAppBotService {
  /**
   * Central command processor for all incoming WhatsApp messages and simulated bot actions.
   * Ensures identical business logic whether a user types a message or clicks a quick-reply button.
   */
  async processCommand(fromPhone: string, rawInput: string): Promise<BotCommandResult> {
    if (!fromPhone) {
      return {
        replyText: 'Error: Missing phone number identifier.',
      };
    }

    // 1. Resolve Account Identity
    const account = await resolveAccount(fromPhone);
    const sessionKey = account.digits10 || fromPhone.replace(/\D/g, '').slice(-10);

    // 2. Unregistered number handling
    if (account.role === 'UNREGISTERED') {
      logger.info(`[WHATSAPP BOT] Unregistered access attempt: ${fromPhone} (digits: ${account.digits10})`);
      if (account.errorType === 'INVALID_FORMAT') {
        const replyText = `⚠️ *Invalid Phone Number*\n\nPlease provide a valid 10-digit mobile number.\n\nExample: *+91 98765 00000* or *9876500000*`;
        await whatsappService.sendMessage(fromPhone, replyText);
        return { replyText, role: 'UNREGISTERED' };
      }

      const formatted = account.digits10 ? `+91 ${account.digits10}` : fromPhone;
      const replyText = `❌ *Account Not Linked*\n\nSorry, I couldn't find a CampusDrop account linked to WhatsApp number *${formatted}*.\n\n• *Students:* Please ensure your mobile number is registered in the University Student Portal.\n• *Security Guards:* Please contact the Logistics Operations Desk to assign your security badge.\n\nHelpline: *+91 98765 00001* (Main Gate Hub)`;
      await whatsappService.sendMessage(fromPhone, replyText);
      return { replyText, role: 'UNREGISTERED' };
    }

    // 3. Normalize Input
    const clean = (rawInput || '').trim().toLowerCase();
    logger.info(`[WHATSAPP BOT] ${account.role} [${account.displayName}] executing: "${clean}"`);

    let result: BotCommandResult;

    // 4. Branch by User Role
    if (account.role === 'STUDENT') {
      result = await this.handleStudentFlow(account.student, clean, sessionKey);
    } else if (account.role === 'GUARD') {
      result = await this.handleGuardFlow(account.guard, clean, sessionKey);
    } else if (account.role === 'ADMIN') {
      result = await this.handleAdminFlow(account.user, clean);
    } else {
      result = {
        replyText: 'Welcome to CampusDrop.',
      };
    }

    result.role = account.role;
    result.user = {
      id: account.student?.id || account.guard?.id || account.user?.id || 'id',
      name: account.displayName,
      identifier: account.identifier,
      phone: account.phone,
      role: account.role,
    };

    // 5. Send outbound WhatsApp message via provider
    const sendResult = await whatsappService.sendMessage(fromPhone, result.replyText, {
      studentId: account.student?.id,
      parcelId: result.parcelId,
      qrPayload: result.qrPayload,
      qrData: result.qrData,
      otp: result.otp,
    });

    result.messageId = sendResult?.messageId;

    return result;
  }

  // ==========================================
  // STUDENT WORKFLOWS
  // ==========================================

  private async handleStudentFlow(student: any, clean: string, sessionKey: string): Promise<BotCommandResult> {
    const activeParcels = (student.parcels || []).filter((p: any) =>
      p.status === ParcelStatus.STORED ||
      p.status === ParcelStatus.READY_FOR_COLLECTION ||
      p.status === ParcelStatus.RECEIVED
    );

    const collectedParcels = (student.parcels || []).filter((p: any) =>
      p.status === ParcelStatus.COLLECTED
    );

    const session = botSessionManager.getSession(sessionKey);

    // Handle interactive conversation context if user is selecting a specific parcel for QR or OTP
    if (session && session.pendingAction) {
      if (clean === 'hi' || clean === 'hello' || clean === 'menu' || clean === 'cancel' || clean === '0') {
        botSessionManager.clearAction(sessionKey);
        return this.renderStudentMenu(student, activeParcels.length);
      }

      if (session.pendingAction === 'AWAITING_PARCEL_FOR_QR') {
        const matched = this.matchParcelFromList(activeParcels, clean);
        if (matched) {
          botSessionManager.clearAction(sessionKey);
          return this.generateParcelQrPass(student, matched);
        }
      }

      if (session.pendingAction === 'AWAITING_PARCEL_FOR_OTP') {
        const matched = this.matchParcelFromList(activeParcels, clean);
        if (matched) {
          botSessionManager.clearAction(sessionKey);
          return this.generateParcelOtp(student, matched);
        }
      }
    }

    // A. MY DELIVERIES
    if (
      clean === '1' ||
      clean === '1.' ||
      clean.includes('my deliveries') ||
      clean.includes('my_deliveries') ||
      clean.includes('deliveries') ||
      clean.includes('📦') ||
      clean.includes('parcels') ||
      clean.includes('track') ||
      clean.includes('package')
    ) {
      botSessionManager.clearAction(sessionKey);
      return this.handleMyDeliveries(student, activeParcels, collectedParcels);
    }

    // B. PICKUP QR
    if (
      clean === '2' ||
      clean === '2.' ||
      clean.includes('pickup qr') ||
      clean.includes('pickup_qr') ||
      clean.includes('qr pass') ||
      clean.includes('qr') ||
      clean.includes('📱') ||
      clean.includes('pass')
    ) {
      return this.handlePickupQr(student, activeParcels, sessionKey);
    }

    // C. GET OTP
    if (
      clean === '3' ||
      clean === '3.' ||
      clean.includes('get otp') ||
      clean.includes('get_otp') ||
      clean.includes('otp code') ||
      clean.includes('otp') ||
      clean.includes('🔑') ||
      clean.includes('pin')
    ) {
      return this.handleGetOtp(student, activeParcels, sessionKey);
    }

    // D. DIRECT PARCEL SELECTION (e.g. "p1", "parcel 2", "cd-260902-0001")
    if (clean.startsWith('p') || clean.startsWith('cd-') || clean.startsWith('parcel')) {
      const matched = this.matchParcelFromList(activeParcels, clean);
      if (matched) {
        botSessionManager.clearAction(sessionKey);
        return this.generateParcelQrPass(student, matched);
      }
    }

    // E. HUB / SECURITY DESK INFO
    if (
      clean === '5' ||
      clean === '5.' ||
      clean.startsWith('5. hub info') ||
      clean === 'hub info' ||
      clean === 'hub_info' ||
      clean === 'info' ||
      clean.includes('contact') ||
      clean.includes('security') ||
      clean.includes('desk') ||
      clean.includes('guard')
    ) {
      botSessionManager.clearAction(sessionKey);
      return this.handleHubInfo(student);
    }

    // F. MAIN MENU / GREETING
    if (
      clean === 'hi' ||
      clean === 'hello' ||
      clean === 'hey' ||
      clean === 'menu' ||
      clean === 'start' ||
      clean === 'help' ||
      clean.includes('hi / menu') ||
      clean === '0'
    ) {
      botSessionManager.clearAction(sessionKey);
      return this.renderStudentMenu(student, activeParcels.length);
    }

    // G. FALLTHROUGH
    return {
      replyText: `Sorry, I didn't recognize that option.\n\nReply with:\n1️⃣ *📦 My Deliveries*\n2️⃣ *📱 Pickup QR*\n3️⃣ *🔑 Get OTP*\n5️⃣ *ℹ️ Hub Info*\n\nOr reply *Hi* to see the main menu.`,
      student: { id: student.id, name: student.name, studentId: student.studentId, phone: student.phone },
    };
  }

  private async handleMyDeliveries(student: any, activeParcels: any[], collectedParcels: any[]): Promise<BotCommandResult> {
    const firstName = student.name ? student.name.split(' ')[0] : 'Student';

    if (activeParcels.length === 0 && collectedParcels.length === 0) {
      return {
        replyText: `📦 *My Deliveries*\n\nHi ${firstName}!\n\nNo deliveries are currently available.\n\nWe will notify you on WhatsApp the moment a courier parcel is received and stored for you at the Main Gate.`,
        student: { id: student.id, name: student.name, studentId: student.studentId, phone: student.phone },
      };
    }

    let collectedSection = '';
    if (collectedParcels.length > 0) {
      const collItems = collectedParcels.slice(0, 3).map((p: any) => {
        const partner = p.delivery?.deliveryPartner?.name || 'Courier';
        const dateStr = p.collectedAt
          ? new Date(p.collectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })
          : 'recently';
        return `• *${partner}* (${p.parcelId}) — Collected on ${dateStr}`;
      }).join('\n');
      collectedSection = `\n\n*Recent Collections:*\n${collItems}`;
    }

    if (activeParcels.length > 0) {
      const items = activeParcels.map((p: any, idx: number) => {
        const partner = p.delivery?.deliveryPartner?.name || 'Courier';
        const rackName = p.storageSlot?.rack?.name || 'Rack A';
        const slotNumber = p.storageSlot?.slotNumber || 'A04';
        const statusEmoji = p.status === 'STORED' ? '🟠' : (p.status === 'READY_FOR_COLLECTION' ? '🟡' : '📦');

        return `${idx + 1}. *${partner}*\nParcel ID: ${p.parcelId}\n📍 ${rackName} → Slot ${slotNumber}\nStatus: ${statusEmoji} ${p.status}`;
      }).join('\n\n');

      return {
        replyText: `📦 *My Deliveries*\n\n${items}\n\nSelect a parcel to continue, or choose an option below:\n📱 *Pickup QR*\n🔑 *Get OTP*${collectedSection}`,
        student: { id: student.id, name: student.name, studentId: student.studentId, phone: student.phone },
      };
    }

    return {
      replyText: `📦 *My Deliveries*\n\nHi ${firstName}, you have no pending packages awaiting collection.${collectedSection}\n\nWe will notify you when a new delivery arrives.`,
      student: { id: student.id, name: student.name, studentId: student.studentId, phone: student.phone },
    };
  }

  private async handlePickupQr(student: any, activeParcels: any[], sessionKey: string): Promise<BotCommandResult> {
    const firstName = student.name ? student.name.split(' ')[0] : 'Student';

    if (activeParcels.length === 0) {
      return {
        replyText: `📱 *Pickup QR Pass*\n\nHi ${firstName}, you have no parcels ready for pickup right now.\n\nOnce a parcel arrives at the campus gate, you will receive a WhatsApp notification to generate your QR pass.`,
        student: { id: student.id, name: student.name, studentId: student.studentId, phone: student.phone },
      };
    }

    if (activeParcels.length === 1) {
      return this.generateParcelQrPass(student, activeParcels[0]);
    }

    botSessionManager.setSession(sessionKey, {
      role: 'STUDENT',
      entityId: student.id,
      pendingAction: 'AWAITING_PARCEL_FOR_QR',
      activeParcelIds: activeParcels.map((p: any) => p.id),
    });

    const list = activeParcels.map((p: any, idx: number) => {
      const partner = p.delivery?.deliveryPartner?.name || 'Courier';
      const slot = p.storageSlot ? `${p.storageSlot.rack.name} → Slot ${p.storageSlot.slotNumber}` : 'Hub Storage';
      return `${idx + 1}. *${partner}* — \`${p.parcelId}\` (${slot})`;
    }).join('\n');

    return {
      replyText: `📱 *Select a parcel for Pickup QR:*\n\n${list}\n\nReply with the number (e.g. *1* or *2*) or Parcel ID to generate your Pickup QR pass.`,
      student: { id: student.id, name: student.name, studentId: student.studentId, phone: student.phone },
    };
  }

  private async handleGetOtp(student: any, activeParcels: any[], sessionKey: string): Promise<BotCommandResult> {
    const firstName = student.name ? student.name.split(' ')[0] : 'Student';

    if (activeParcels.length === 0) {
      return {
        replyText: `🔑 *Pickup OTP*\n\nHi ${firstName}, you have no stored parcels awaiting collection at this time.`,
        student: { id: student.id, name: student.name, studentId: student.studentId, phone: student.phone },
      };
    }

    if (activeParcels.length === 1) {
      return this.generateParcelOtp(student, activeParcels[0]);
    }

    botSessionManager.setSession(sessionKey, {
      role: 'STUDENT',
      entityId: student.id,
      pendingAction: 'AWAITING_PARCEL_FOR_OTP',
      activeParcelIds: activeParcels.map((p: any) => p.id),
    });

    const list = activeParcels.map((p: any, idx: number) => {
      const partner = p.delivery?.deliveryPartner?.name || 'Courier';
      const slot = p.storageSlot ? `${p.storageSlot.rack.name} → Slot ${p.storageSlot.slotNumber}` : 'Hub Storage';
      return `${idx + 1}. *${partner}* — \`${p.parcelId}\` (${slot})`;
    }).join('\n');

    return {
      replyText: `🔑 *Select a parcel for OTP:*\n\n${list}\n\nReply with the number (e.g. *1* or *2*) or Parcel ID to get your OTP.`,
      student: { id: student.id, name: student.name, studentId: student.studentId, phone: student.phone },
    };
  }

  private async generateParcelQrPass(student: any, parcel: any): Promise<BotCommandResult> {
    const qrRes = await pickupService.generateQrToken(parcel.id, student.id);
    const partner = parcel.delivery?.deliveryPartner?.name || 'Courier';
    const location = parcel.storageSlot
      ? `${parcel.storageSlot.rack.name} → Slot ${parcel.storageSlot.slotNumber}`
      : 'Main Gate Delivery Hub';

    const qrPayload = JSON.stringify({
      type: 'campusdrop_parcel',
      parcelId: parcel.parcelId,
      token: qrRes.token,
    });

    const replyText = `📱 *Pickup QR Pass*

Hi ${student.name}, here is your single-use pass for parcel \`${parcel.parcelId}\` (*${partner}*):

📍 *Storage:* ${location}
⏱️ *Valid for:* ${qrRes.validityMinutes} minutes

Show this QR code at the Main Gate Storage Counter for verification & collection.`;

    return {
      replyText,
      qrData: qrRes.token,
      qrPayload,
      parcelId: parcel.parcelId,
      student: { id: student.id, name: student.name, studentId: student.studentId, phone: student.phone },
    };
  }

  private async generateParcelOtp(student: any, parcel: any): Promise<BotCommandResult> {
    const otpRes = await pickupService.generateOtp(parcel.id, student.id);
    const partner = parcel.delivery?.deliveryPartner?.name || 'Courier';
    const location = parcel.storageSlot
      ? `${parcel.storageSlot.rack.name} → Slot ${parcel.storageSlot.slotNumber}`
      : 'Main Gate Delivery Hub';

    const replyText = `🔑 *Pickup OTP*

Your pickup OTP is:

*${otpRes.otpCode}*

Use this OTP at the security desk to collect your parcel \`${parcel.parcelId}\` (*${partner}*).
📍 *Storage:* ${location}

Valid for 10 minutes.
Do not share this OTP with anyone.`;

    return {
      replyText,
      otp: otpRes.otpCode,
      parcelId: parcel.parcelId,
      student: { id: student.id, name: student.name, studentId: student.studentId, phone: student.phone },
    };
  }

  private renderStudentMenu(student: any, activeCount: number): BotCommandResult {
    const countText = activeCount > 0 ? ` (You have *${activeCount}* package${activeCount > 1 ? 's' : ''} ready!)` : '';
    const replyText = `👋 Hi ${student.name}! Welcome to CampusDrop.${countText}\n\nHow can I help you today?\n\n1️⃣ 1. My Deliveries\n2️⃣ 2. Pickup QR\n3️⃣ 3. Get OTP\n5️⃣ 5. Hub Info\n\nReply with 1, 2, 3, or 5, or use the quick buttons below.`;

    return {
      replyText,
      student: { id: student.id, name: student.name, studentId: student.studentId, phone: student.phone },
    };
  }

  private handleHubInfo(student: any): BotCommandResult {
    const replyText = `👮 *Campus Security & Delivery Counter*\n\n*Counter Location:* Main Gate 1 Delivery Hub, Rishihood University\n*Operating Hours:* 08:00 AM – 10:00 PM (All 7 Days)\n*Security Desk Helpline:* +91 98765 00001\n*Logistics Support:* logistics@campusdrop.demo\n\nReply *1* anytime to see your active deliveries.`;

    return {
      replyText,
      student: { id: student.id, name: student.name, studentId: student.studentId, phone: student.phone },
    };
  }

  // ==========================================
  // GUARD WORKFLOWS
  // ==========================================

  private async handleGuardFlow(guard: any, clean: string, sessionKey: string): Promise<BotCommandResult> {
    // 1. RECEIVE PARCEL (Intake info and latest logged intake)
    if (
      clean === '1' ||
      clean === '1.' ||
      clean.startsWith('1. receive parcel') ||
      clean === 'receive parcel' ||
      clean === 'receive_parcel' ||
      clean === 'receive' ||
      clean === 'intake'
    ) {
      return this.handleGuardReceiveParcel(guard);
    }

    // 2. MY ASSIGNED DELIVERIES / RECENT INTAKES
    if (
      clean === '2' ||
      clean === '2.' ||
      clean.startsWith('2. my assigned deliveries') ||
      clean.startsWith('2. my deliveries') ||
      clean === 'my assigned deliveries' ||
      clean === 'my deliveries' ||
      clean === 'my_deliveries' ||
      clean === 'deliveries'
    ) {
      return this.handleGuardAssignedDeliveries(guard);
    }

    // 3. SCAN PICKUP QR
    if (
      clean === '3' ||
      clean === '3.' ||
      clean.startsWith('3. scan pickup qr') ||
      clean.startsWith('3. scan qr') ||
      clean === 'scan pickup qr' ||
      clean === 'scan qr' ||
      clean === 'scan' ||
      clean === 'qr'
    ) {
      return this.handleGuardScanQrInfo(guard);
    }

    // 4. VERIFY OTP
    if (
      clean === '4' ||
      clean === '4.' ||
      clean.startsWith('4. verify otp') ||
      clean === 'verify otp' ||
      clean === 'verify_otp' ||
      clean.startsWith('verify ') ||
      clean === 'otp' ||
      /^\d{6}$/.test(clean)
    ) {
      return this.handleGuardVerifyOtp(guard, clean);
    }

    // 5. HELP / DESK INFO
    if (
      clean === '5' ||
      clean === '5.' ||
      clean.startsWith('5. help') ||
      clean === 'help' ||
      clean.includes('duty') ||
      clean.includes('desk')
    ) {
      return this.handleGuardHelp(guard);
    }

    // MENU / GREETING
    if (
      clean === 'hi' ||
      clean === 'hello' ||
      clean === 'menu' ||
      clean === 'start' ||
      clean.includes('hi / menu') ||
      clean === '0'
    ) {
      return this.renderGuardMenu(guard);
    }

    return {
      replyText: `Officer ${guard.name}, please choose a guard operation:\n\n1️⃣ 1. Receive Parcel\n2️⃣ 2. My Assigned Deliveries\n3️⃣ 3. Scan Pickup QR\n4️⃣ 4. Verify OTP\n5️⃣ 5. Help\n\nOr reply *Hi* to see the menu.`,
    };
  }

  private async handleGuardReceiveParcel(guard: any): Promise<BotCommandResult> {
    // Fetch latest received parcel (either by this guard or overall at main gate)
    let latestParcel = await prisma.parcel.findFirst({
      where: {
        OR: [
          { receivedByGuardId: guard.id },
          { delivery: { guardId: guard.id } },
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        student: true,
        delivery: { include: { deliveryPartner: true } },
        storageSlot: { include: { rack: true } },
      }
    });

    if (!latestParcel) {
      latestParcel = await prisma.parcel.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
          student: true,
          delivery: { include: { deliveryPartner: true } },
          storageSlot: { include: { rack: true } },
        }
      });
    }

    if (!latestParcel) {
      return {
        replyText: `📦 *Guard Parcel Intake*\n\nOfficer ${guard.name} (${guard.badgeNumber}),\n\nNo parcels have been logged yet.\n\nTo receive and store a courier delivery for a student:\n1. Open the Guard Intake Portal at */guard/deliveries*\n2. Search student by roll or name\n3. Select courier partner & storage slot\n4. Submit to automatically notify the student on WhatsApp.`,
      };
    }

    const partnerName = latestParcel.delivery?.deliveryPartner?.name || 'Courier';
    const slotLocation = latestParcel.storageSlot
      ? `${latestParcel.storageSlot.rack.name} → Slot ${latestParcel.storageSlot.slotNumber}`
      : 'Main Hub Storage';
    const tracking = latestParcel.trackingNumber || latestParcel.delivery?.trackingNumber || 'N/A';
    const dateStr = new Date(latestParcel.receivedAt || latestParcel.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const replyText = `📦 *Parcel Received*\n\n*Student:* ${latestParcel.student.name}\n*Partner:* ${partnerName}\n*Parcel ID:* ${latestParcel.parcelId}\n*Storage:* ${slotLocation}\n*Status:* ${latestParcel.status}\n*Tracking:* ${tracking}\n*Received:* ${dateStr}\n\n✅ Stored in storage matrix. The student has received real-time collection instructions on WhatsApp.\n\nTo receive new inbound parcels, visit */guard/deliveries*.`;

    return {
      replyText,
      parcelId: latestParcel.parcelId,
    };
  }

  private async handleGuardAssignedDeliveries(guard: any): Promise<BotCommandResult> {
    const parcels = await prisma.parcel.findMany({
      where: {
        OR: [
          { receivedByGuardId: guard.id },
          { delivery: { guardId: guard.id } },
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        student: true,
        delivery: { include: { deliveryPartner: true } },
        storageSlot: { include: { rack: true } },
      }
    });

    if (parcels.length === 0) {
      return {
        replyText: `📋 *My Assigned Deliveries*\n\nOfficer ${guard.name}, you currently have no parcel deliveries assigned to your badge (${guard.badgeNumber}).\n\nWhen you record courier deliveries at the gate, your latest intakes will appear here.`,
      };
    }

    const items = parcels.map((p: any, idx: number) => {
      const partner = p.delivery?.deliveryPartner?.name || 'Courier';
      const slot = p.storageSlot ? `${p.storageSlot.rack.name} (Slot ${p.storageSlot.slotNumber})` : 'Hub';
      const statusIcon = p.status === ParcelStatus.COLLECTED ? '✅' : '📦';
      return `${idx + 1}. ${statusIcon} *${p.parcelId}* (${partner})\nStudent: ${p.student.name} (${p.student.studentId})\nLocation: ${slot}\nStatus: *${p.status}*`;
    }).join('\n\n');

    return {
      replyText: `📋 *My Assigned Deliveries*\nOfficer ${guard.name} (${guard.badgeNumber})\n\n${items}\n\nReply *1* to view parcel intake details or *4* to verify a student's OTP.`,
    };
  }

  private handleGuardScanQrInfo(guard: any): BotCommandResult {
    const replyText = `📷 *Scan Pickup QR*\n\nOfficer ${guard.name},\n\nTo verify a student's pickup QR code:\n1. Ask the student to open CampusDrop on WhatsApp and tap *2. Pickup QR*.\n2. Open the Guard Handover Scanner on your tablet or smartphone:\n👉 */guard/handover*\n3. Point your camera at the student's QR pass.\n\nThe system validates the parcel, student identity, and frees the storage slot upon handover.`;

    return { replyText };
  }

  private async handleGuardVerifyOtp(guard: any, clean: string): Promise<BotCommandResult> {
    // Extract 6-digit code from message e.g. "verify 123456", "123456", or "otp 123456"
    const match = clean.match(/\b\d{6}\b/);
    if (!match) {
      return {
        replyText: `🔐 *Verify Pickup OTP*\n\nOfficer ${guard.name},\n\nTo verify a student's 6-digit OTP code directly in WhatsApp, reply with:\n👉 *VERIFY <6-digit OTP>*\nExample: *VERIFY 123456*\n\nAlternatively, you can enter the code in the Guard Handover Portal at */guard/handover*.`,
      };
    }

    const otpCode = match[0];
    try {
      const verified = await pickupService.verifyOtp(otpCode);
      return {
        replyText: `✅ *OTP Verified Successfully*\n\n*Student:* ${verified.student.name} (${verified.student.studentId})\n*Parcel ID:* ${verified.parcel.parcelId}\n*Partner:* ${verified.parcel.partner}\n*Storage:* ${verified.parcel.slot}\n\nYou may safely hand over the package to ${verified.student.name}.\nConfirm handover in the portal at */guard/handover*.`,
        parcelId: verified.parcel.parcelId,
      };
    } catch (err: any) {
      return {
        replyText: `❌ *OTP Verification Failed*\n\nOTP *${otpCode}* is invalid or has expired.\n\nPlease verify with the student or ask them to tap *3. Get OTP* in their CampusDrop WhatsApp to generate a fresh code.`,
      };
    }
  }

  private handleGuardHelp(guard: any): BotCommandResult {
    const gate = guard.gateNumber || 'Main Gate 1';
    const shift = guard.shift || 'Morning Shift';
    const replyText = `🛡️ *CampusDrop Security Desk Assistance*\n\n*Duty Officer:* ${guard.name}\n*Badge:* ${guard.badgeNumber}\n*Station:* ${gate}\n*Shift:* ${shift}\n\n*Gate Operations Protocol:*\n• All couriers must be logged immediately into the portal.\n• Always verify student identity via Pickup QR or 6-digit OTP before releasing parcels.\n• Emergency IT Helpline: +91 98765 00000`;

    return { replyText };
  }

  private renderGuardMenu(guard: any): BotCommandResult {
    const replyText = `🛡️ *CampusDrop Guard Portal*\nOfficer: *${guard.name}* (Badge: *${guard.badgeNumber}*)\nStation: ${guard.gateNumber || 'Main Gate 1'}\n\nAvailable Guard Operations:\n1️⃣ 1. Receive Parcel\n2️⃣ 2. My Assigned Deliveries\n3️⃣ 3. Scan Pickup QR\n4️⃣ 4. Verify OTP\n5️⃣ 5. Help\n\nReply with 1, 2, 3, 4, or 5, or use the quick buttons below.`;

    return { replyText };
  }

  // ==========================================
  // ADMIN WORKFLOWS
  // ==========================================

  private async handleAdminFlow(user: any, clean: string): Promise<BotCommandResult> {
    const [totalParcels, storedParcels, todayPickups] = await Promise.all([
      prisma.parcel.count(),
      prisma.parcel.count({ where: { status: ParcelStatus.STORED } }),
      prisma.pickup.count({
        where: {
          verifiedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      })
    ]);

    const replyText = `🏢 *CampusDrop Operations Admin*\nWelcome, ${user.name}!\n\n📊 *Live Campus Statistics:*\n• Active Stored Parcels: *${storedParcels}*\n• Pickups Completed Today: *${todayPickups}*\n• Total Historical Deliveries: *${totalParcels}*\n\nAccess the full Admin Command Dashboard at */admin/analytics*.`;

    return { replyText };
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private matchParcelFromList(parcels: any[], clean: string): any | null {
    // 1. Match by parcelId exact (case insensitive)
    const directMatch = parcels.find((p: any) => p.parcelId.toLowerCase() === clean);
    if (directMatch) return directMatch;

    // 2. Match by index (e.g. "1", "2", "p1", "parcel 2")
    const match = clean.match(/(?:p|parcel\s*)?([1-9]\d*)/);
    if (match) {
      const idx = parseInt(match[1], 10) - 1;
      if (idx >= 0 && idx < parcels.length) {
        return parcels[idx];
      }
    }

    return null;
  }
}

export const whatsAppBotService = new WhatsAppBotService();
