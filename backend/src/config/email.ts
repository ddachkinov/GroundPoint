import { env } from './env';

/**
 * Email configuration
 */
export const emailConfig = {
  from: env.EMAIL_FROM_ADDRESS,
  apiKey: env.EMAIL_API_KEY,

  // Email templates
  templates: {
    verification: {
      subject: 'Verify your GroundPoint account',
      template: 'verification',
    },
    passwordReset: {
      subject: 'Reset your GroundPoint password',
      template: 'password-reset',
    },
    welcomeOperator: {
      subject: 'Welcome to GroundPoint',
      template: 'welcome-operator',
    },
    welcomeSiteOwner: {
      subject: 'You've been invited to a project on GroundPoint',
      template: 'welcome-site-owner',
    },
  },
};

/**
 * Email provider types
 */
export type EmailProvider = 'postmark' | 'sendgrid' | 'smtp';

/**
 * Get email provider from environment
 */
export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER || 'postmark';

  if (!['postmark', 'sendgrid', 'smtp'].includes(provider)) {
    throw new Error(`Invalid email provider: ${provider}`);
  }

  return provider as EmailProvider;
}
