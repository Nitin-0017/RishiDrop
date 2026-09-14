import { prisma } from '../config';
import { logger } from '../utils/logger';

export interface LogAuditParams {
  userId?: string;
  role?: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  async log(params: LogAuditParams): Promise<void> {
    try {
      let validUserId: string | null = null;
      if (params.userId) {
        const u = await prisma.user.findUnique({ where: { id: params.userId }, select: { id: true } });
        if (u) validUserId = u.id;
      }

      await prisma.auditLog.create({
        data: {
          userId: validUserId,
          role: params.role,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          metadata: params.metadata || {},
          timestamp: new Date(),
        }
      });
    } catch (error: any) {
      logger.error('Failed to write audit log:', error.message);
    }
  }
}

export const auditService = new AuditService();
