import { env } from '../config/env';
import { emailConfig } from '../config/email';

/**
 * Email data interface
 */
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Email service for sending transactional emails
 */
class EmailService {
  private from: string;

  constructor() {
    this.from = emailConfig.from;
  }

  /**
   * Send an email
   * @param data - Email data
   */
  async sendEmail(data: EmailData): Promise<void> {
    // In development, log emails instead of sending
    if (env.NODE_ENV === 'development') {
      console.log('📧 [Email Service] Would send email:', {
        from: this.from,
        to: data.to,
        subject: data.subject,
        preview: data.html.substring(0, 100) + '...',
      });
      return;
    }

    // TODO: Implement actual email sending with Postmark/SendGrid
    // For now, we'll log in production too until email service is configured
    console.log('📧 [Email Service] Sending email:', {
      from: this.from,
      to: data.to,
      subject: data.subject,
    });
  }

  /**
   * Send email verification email
   * @param email - Recipient email
   * @param verificationToken - Verification token
   */
  async sendVerificationEmail(
    email: string,
    firstName: string,
    verificationToken: string
  ): Promise<void> {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const html = this.getVerificationEmailTemplate(firstName, verificationUrl);
    const text = `Hi ${firstName},\n\nPlease verify your email address by clicking the following link:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`;

    await this.sendEmail({
      to: email,
      subject: emailConfig.templates.verification.subject,
      html,
      text,
    });
  }

  /**
   * Send password reset email
   * @param email - Recipient email
   * @param resetToken - Password reset token
   */
  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = this.getPasswordResetEmailTemplate(firstName, resetUrl);
    const text = `Hi ${firstName},\n\nYou requested to reset your password. Click the following link to reset it:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, please ignore this email.`;

    await this.sendEmail({
      to: email,
      subject: emailConfig.templates.passwordReset.subject,
      html,
      text,
    });
  }

  /**
   * Send welcome email to new operator
   * @param email - Recipient email
   * @param firstName - User's first name
   */
  async sendWelcomeOperatorEmail(
    email: string,
    firstName: string
  ): Promise<void> {
    const html = this.getWelcomeOperatorTemplate(firstName);
    const text = `Welcome to GroundPoint, ${firstName}!\n\nYou're all set to start managing your drone construction progress projects.\n\nGet started: ${env.FRONTEND_URL}/dashboard`;

    await this.sendEmail({
      to: email,
      subject: emailConfig.templates.welcomeOperator.subject,
      html,
      text,
    });
  }

  /**
   * Email templates
   */
  private getVerificationEmailTemplate(
    firstName: string,
    verificationUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0ea5e9;">Welcome to GroundPoint!</h1>
            <p>Hi ${firstName},</p>
            <p>Thanks for signing up! Please verify your email address to get started.</p>
            <p style="margin: 30px 0;">
              <a href="${verificationUrl}"
                 style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email Address
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationUrl}">${verificationUrl}</a>
            </p>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 24 hours.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't create an account, please ignore this email.
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              GroundPoint - Drone Construction Progress Monitoring
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private getPasswordResetEmailTemplate(
    firstName: string,
    resetUrl: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0ea5e9;">Reset Your Password</h1>
            <p>Hi ${firstName},</p>
            <p>You requested to reset your password. Click the button below to create a new password.</p>
            <p style="margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link into your browser:<br>
              <a href="${resetUrl}">${resetUrl}</a>
            </p>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              GroundPoint - Drone Construction Progress Monitoring
            </p>
          </div>
        </body>
      </html>
    `;
  }

  private getWelcomeOperatorTemplate(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0ea5e9;">Welcome to GroundPoint!</h1>
            <p>Hi ${firstName},</p>
            <p>Your account has been verified and you're all set to start managing your drone construction progress projects.</p>
            <h2 style="color: #333; font-size: 18px;">Getting Started</h2>
            <ul style="line-height: 2;">
              <li>Create your first project</li>
              <li>Add sites to your projects</li>
              <li>Upload drone captures</li>
              <li>Share progress with your clients</li>
            </ul>
            <p style="margin: 30px 0;">
              <a href="${env.FRONTEND_URL}/dashboard"
                 style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Go to Dashboard
              </a>
            </p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              GroundPoint - Drone Construction Progress Monitoring
            </p>
          </div>
        </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
