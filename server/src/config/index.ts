import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load .env from workspace root or current directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5001', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://nitinkumar@localhost:5432/campusdrop?schema=public',
  jwt: {
    secret: process.env.JWT_SECRET || 'campusdrop_jwt_super_secret_production_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'campusdrop_verify_token_2026',
    apiUrl: 'https://graph.facebook.com/v21.0',
  },
  pickup: {
    qrExpiryMinutes: 15,
    otpExpiryMinutes: 10,
    maxOtpAttempts: 3,
  },
  storage: {
    defaultRackCapacity: 50,
    racks: ['Rack A', 'Rack B', 'Rack C'],
  }
};

// Singleton Prisma Client
declare global {
  var prismaClient: PrismaClient | undefined;
}

export const prisma = global.prismaClient || new PrismaClient({
  log: config.env === 'development' ? ['warn', 'error'] : ['error'],
});

if (config.env !== 'production') {
  global.prismaClient = prisma;
}
