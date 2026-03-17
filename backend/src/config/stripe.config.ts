import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export const stripeClient = stripe;

// Subscription tier pricing (Stripe Price IDs from environment)
export const TIER_PRICES = {
  PROFESSIONAL_MONTHLY: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || '',
  PROFESSIONAL_YEARLY: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || '',
  BUSINESS_MONTHLY: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || '',
  BUSINESS_YEARLY: process.env.STRIPE_PRICE_BUSINESS_YEARLY || '',
};

// Subscription tier quotas
export const TIER_QUOTAS = {
  FREE: {
    storage: 2 * 1024 * 1024 * 1024, // 2 GB in bytes
    uploadsPerMonth: 100,
    projects: 3,
    retentionDays: 30,
  },
  PROFESSIONAL: {
    storage: 50 * 1024 * 1024 * 1024, // 50 GB
    uploadsPerMonth: 1000,
    projects: -1, // Unlimited
    retentionDays: 365,
  },
  BUSINESS: {
    storage: 500 * 1024 * 1024 * 1024, // 500 GB
    uploadsPerMonth: -1, // Unlimited
    projects: -1,
    retentionDays: 1095, // 3 years
  },
  ENTERPRISE: {
    storage: -1, // Unlimited
    uploadsPerMonth: -1,
    projects: -1,
    retentionDays: -1, // Lifetime
  },
};
