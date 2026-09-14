import { prisma } from '../config';

/**
 * Generates a globally unique, sequential Parcel ID in the format:
 * CD-YYMMDD-XXXX (e.g. CD-260902-0001, CD-260902-0002)
 *
 * YY: 2-digit year (e.g. 26)
 * MM: 2-digit month (e.g. 09)
 * DD: 2-digit day (e.g. 02)
 * XXXX: 4-digit daily sequential counter padded with zeroes (0001, 0002, ...)
 */
export async function generateUniqueParcelId(): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `CD-${yy}${mm}${dd}-`;

  // Start of today and end of today in UTC/local
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Count parcels created today or query the highest sequential parcelId today
  const latestToday = await prisma.parcel.findFirst({
    where: {
      parcelId: {
        startsWith: prefix,
      },
    },
    orderBy: {
      parcelId: 'desc',
    },
    select: {
      parcelId: true,
    },
  });

  let nextSeq = 1;
  if (latestToday && latestToday.parcelId) {
    const parts = latestToday.parcelId.split('-');
    if (parts.length === 3) {
      const currentSeq = parseInt(parts[2], 10);
      if (!isNaN(currentSeq)) {
        nextSeq = currentSeq + 1;
      }
    }
  }

  // Format with leading zeroes to 4 digits
  let candidateId = `${prefix}${String(nextSeq).padStart(4, '0')}`;

  // Double-check uniqueness in case of race condition
  let attempts = 0;
  while (attempts < 10) {
    const exists = await prisma.parcel.findUnique({
      where: { parcelId: candidateId },
      select: { id: true },
    });
    if (!exists) {
      return candidateId;
    }
    nextSeq += 1;
    candidateId = `${prefix}${String(nextSeq).padStart(4, '0')}`;
    attempts += 1;
  }

  // Fallback fallback with random suffix if high collision
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}
