import dotenv from 'dotenv';

dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),

  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,

  S3_ENDPOINT: process.env.S3_ENDPOINT!,
  S3_BUCKET: process.env.S3_BUCKET!,
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY!,
  S3_SECRET_KEY: process.env.S3_SECRET_KEY!,
  S3_REGION: process.env.S3_REGION || 'us-east-1',

  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '15m',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
  STRIPE_CONNECT_CLIENT_ID: process.env.STRIPE_CONNECT_CLIENT_ID!,
  STRIPE_CONNECT_REDIRECT_URI: process.env.STRIPE_CONNECT_REDIRECT_URI!,

  PLATFORM_FEE_PERCENT: parseFloat(process.env.PLATFORM_FEE_PERCENT || '5'),
  PLATFORM_FIXED_FEE: parseFloat(process.env.PLATFORM_FIXED_FEE || '0.50'),

  APP_URL: process.env.APP_URL || 'http://localhost:4000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  EMAIL_API_KEY: process.env.EMAIL_API_KEY!,
  EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS!,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'GroundPoint',

  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@groundpoint.dev',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  THUMBNAIL_QUEUE_NAME: process.env.THUMBNAIL_QUEUE_NAME || 'thumbnail-generation',
  PAYOUT_QUEUE_NAME: process.env.PAYOUT_QUEUE_NAME || 'payout-processing',
  EMAIL_QUEUE_NAME: process.env.EMAIL_QUEUE_NAME || 'email-notifications',
};

const requiredEnvVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

export function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
