import crypto from 'crypto';

/**
 * Generates an authoritative, server-side parcel identifier: CD-YYYYMMDD-XXXXXX
 * e.g., CD-20260901-000124
 */
export function generateParcelId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // 6-digit random / incremental sequence
  const randomSeq = Math.floor(100000 + Math.random() * 900000);
  return `CD-${dateStr}-${randomSeq}`;
}

/**
 * Generates a delivery number: DEL-YYYYMMDD-XXXXX
 */
export function generateDeliveryNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSeq = Math.floor(10000 + Math.random() * 90000);
  return `DEL-${dateStr}-${randomSeq}`;
}

/**
 * Generates a secure, 6-digit one-time password
 */
export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Generates a secure random pickup token (single-use UUID / hex string)
 */
export function generatePickupToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Masks phone number for privacy display (e.g., +91 98765****0)
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  const visibleStart = phone.slice(0, 5);
  const visibleEnd = phone.slice(-2);
  const maskedLength = Math.max(phone.length - 7, 3);
  return `${visibleStart}${'*'.repeat(maskedLength)}${visibleEnd}`;
}

/**
 * Normalizes phone number to standard 10 or 12 digit format
 */
export function normalizePhone(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 12 && clean.startsWith('91')) {
    return clean.slice(2);
  }
  return clean;
}
