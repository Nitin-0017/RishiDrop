import { prisma } from '../config';

/**
 * Returns current date prefix in DD-MM format using local/current date.
 * Example: 2026-09-09 -> "09-09"
 */
export function getCurrentOversizedDatePrefix(date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}`;
}

/**
 * Previews the next oversized reference number for today without committing/incrementing.
 * Format: DD-MM-XXX (e.g. 09-09-001, 09-09-002)
 */
export async function previewNextOversizedReference(date = new Date()): Promise<string> {
  const prefix = getCurrentOversizedDatePrefix(date);

  // Check DailySequence first
  const record = await prisma.dailySequence.findUnique({
    where: { datePrefix: prefix },
  });

  let nextSeq = (record?.lastSeq || 0) + 1;

  // Also verify against any existing Parcel records in case of DB restore/seeding
  const latestParcel = await prisma.parcel.findFirst({
    where: {
      oversizedReference: {
        startsWith: `${prefix}-`,
      },
    },
    orderBy: {
      oversizedReference: 'desc',
    },
    select: {
      oversizedReference: true,
    },
  });

  if (latestParcel?.oversizedReference) {
    const parts = latestParcel.oversizedReference.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed) && parsed >= nextSeq) {
        nextSeq = parsed + 1;
      }
    }
  }

  return `${prefix}-${String(nextSeq).padStart(3, '0')}`;
}

/**
 * Generates an authoritative, atomic, sequential oversized parcel reference.
 * Format: DD-MM-XXX (e.g. 09-09-001)
 * 
 * Rules:
 * - Resets to 001 every calendar day.
 * - Concurrency safe via PostgreSQL upsert & atomic increment + uniqueness check loop.
 * - Guaranteed unique.
 */
export async function generateUniqueOversizedReference(txPrisma?: any): Promise<string> {
  const db = txPrisma || prisma;
  const prefix = getCurrentOversizedDatePrefix(new Date());

  // 1. Atomically increment or create the daily sequence
  const seqRecord = await db.dailySequence.upsert({
    where: { datePrefix: prefix },
    create: { datePrefix: prefix, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });

  let currentSeq = seqRecord.lastSeq;
  let candidate = `${prefix}-${String(currentSeq).padStart(3, '0')}`;

  // 2. Double-check against Parcel unique constraint just in case
  let attempts = 0;
  while (attempts < 10) {
    const exists = await db.parcel.findUnique({
      where: { oversizedReference: candidate },
      select: { id: true },
    });

    if (!exists) {
      // Sync lastSeq if we had to adjust
      if (currentSeq !== seqRecord.lastSeq) {
        await db.dailySequence.update({
          where: { datePrefix: prefix },
          data: { lastSeq: currentSeq },
        });
      }
      return candidate;
    }

    currentSeq += 1;
    candidate = `${prefix}-${String(currentSeq).padStart(3, '0')}`;
    attempts += 1;
  }

  return candidate;
}
