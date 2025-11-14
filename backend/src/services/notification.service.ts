import { PrismaClient, NotificationType, NotificationStatus } from '@prisma/client';
import { emailClient } from '../config/email.config';
import * as emailTemplates from '../templates/email-templates';

const prisma = new PrismaClient();

export class NotificationService {
  /**
   * Send invoice sent notification to Site Owner
   */
  async sendInvoiceSent(
    recipientUserId: string,
    data: emailTemplates.InvoiceSentData,
    pdfAttachment?: { filename: string; content: Buffer }
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: recipientUserId },
      });

      if (!user) {
        throw new Error('Recipient user not found');
      }

      const { subject, html } = emailTemplates.invoiceSentTemplate(data);

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          recipientUserId,
          type: NotificationType.INVOICE_SENT,
          subject,
          body: html,
          status: NotificationStatus.PENDING,
        },
      });

      try {
        // Send email
        const { messageId } = await emailClient.send({
          to: user.email,
          subject,
          html,
          attachments: pdfAttachment ? [{ ...pdfAttachment, contentType: 'application/pdf' }] : [],
        });

        // Update notification status
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });

        console.log(`Invoice sent notification delivered: ${messageId}`);
      } catch (error) {
        // Mark as failed
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.FAILED,
          },
        });
        throw error;
      }
    } catch (error: any) {
      console.error('Error sending invoice sent notification:', error);
      throw new Error(`Failed to send invoice notification: ${error.message}`);
    }
  }

  /**
   * Send payment confirmation to Site Owner
   */
  async sendPaymentConfirmationClient(
    recipientUserId: string,
    data: emailTemplates.PaymentConfirmationClientData
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: recipientUserId },
      });

      if (!user) {
        throw new Error('Recipient user not found');
      }

      const { subject, html } = emailTemplates.paymentConfirmationClientTemplate(data);

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          recipientUserId,
          type: NotificationType.PAYMENT_CONFIRMATION,
          subject,
          body: html,
          status: NotificationStatus.PENDING,
        },
      });

      try {
        // Send email
        const { messageId } = await emailClient.send({
          to: user.email,
          subject,
          html,
        });

        // Update notification status
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });

        console.log(`Payment confirmation (client) delivered: ${messageId}`);
      } catch (error) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.FAILED,
          },
        });
        throw error;
      }
    } catch (error: any) {
      console.error('Error sending payment confirmation (client):', error);
      // Don't throw - payment already succeeded
    }
  }

  /**
   * Send payment confirmation to Operator
   */
  async sendPaymentConfirmationOperator(
    recipientUserId: string,
    data: emailTemplates.PaymentConfirmationOperatorData
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: recipientUserId },
      });

      if (!user) {
        throw new Error('Recipient user not found');
      }

      const { subject, html } = emailTemplates.paymentConfirmationOperatorTemplate(data);

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          recipientUserId,
          type: NotificationType.PAYMENT_CONFIRMATION,
          subject,
          body: html,
          status: NotificationStatus.PENDING,
        },
      });

      try {
        // Send email
        const { messageId } = await emailClient.send({
          to: user.email,
          subject,
          html,
        });

        // Update notification status
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });

        console.log(`Payment confirmation (operator) delivered: ${messageId}`);
      } catch (error) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.FAILED,
          },
        });
        throw error;
      }
    } catch (error: any) {
      console.error('Error sending payment confirmation (operator):', error);
      // Don't throw - payment already succeeded
    }
  }

  /**
   * Send overdue reminder to Site Owner
   */
  async sendOverdueReminder(
    recipientUserId: string,
    data: emailTemplates.OverdueReminderData,
    reminderNumber: 1 | 2 | 3
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: recipientUserId },
      });

      if (!user) {
        throw new Error('Recipient user not found');
      }

      const { subject, html } = emailTemplates.overdueReminderTemplate(data, reminderNumber);

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          recipientUserId,
          type: NotificationType.OVERDUE_REMINDER,
          subject,
          body: html,
          status: NotificationStatus.PENDING,
        },
      });

      try {
        // Send email
        const { messageId } = await emailClient.send({
          to: user.email,
          subject,
          html,
        });

        // Update notification status
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });

        console.log(`Overdue reminder ${reminderNumber} delivered: ${messageId}`);
      } catch (error) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.FAILED,
          },
        });
        throw error;
      }
    } catch (error: any) {
      console.error('Error sending overdue reminder:', error);
      throw new Error(`Failed to send overdue reminder: ${error.message}`);
    }
  }

  /**
   * Send payout confirmation to Operator
   */
  async sendPayoutConfirmation(
    recipientUserId: string,
    data: emailTemplates.PayoutConfirmationData
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: recipientUserId },
      });

      if (!user) {
        throw new Error('Recipient user not found');
      }

      const { subject, html } = emailTemplates.payoutConfirmationTemplate(data);

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          recipientUserId,
          type: NotificationType.PAYOUT_CONFIRMATION,
          subject,
          body: html,
          status: NotificationStatus.PENDING,
        },
      });

      try {
        // Send email
        const { messageId } = await emailClient.send({
          to: user.email,
          subject,
          html,
        });

        // Update notification status
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });

        console.log(`Payout confirmation delivered: ${messageId}`);
      } catch (error) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.FAILED,
          },
        });
        throw error;
      }
    } catch (error: any) {
      console.error('Error sending payout confirmation:', error);
      // Don't throw - payout already processed
    }
  }

  /**
   * Send payout failed notification to Operator
   */
  async sendPayoutFailed(
    recipientUserId: string,
    data: emailTemplates.PayoutFailedData
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: recipientUserId },
      });

      if (!user) {
        throw new Error('Recipient user not found');
      }

      const { subject, html } = emailTemplates.payoutFailedTemplate(data);

      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          recipientUserId,
          type: NotificationType.PAYOUT_FAILED,
          subject,
          body: html,
          status: NotificationStatus.PENDING,
        },
      });

      try {
        // Send email
        const { messageId } = await emailClient.send({
          to: user.email,
          subject,
          html,
        });

        // Update notification status
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });

        console.log(`Payout failed notification delivered: ${messageId}`);
      } catch (error) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.FAILED,
          },
        });
        throw error;
      }
    } catch (error: any) {
      console.error('Error sending payout failed notification:', error);
      // Don't throw - critical notification
    }
  }

  /**
   * Send Connect account onboarding complete notification
   */
  async sendConnectAccountComplete(
    recipientUserId: string,
    data: emailTemplates.ConnectAccountCompleteData
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: recipientUserId },
      });

      if (!user) {
        throw new Error('Recipient user not found');
      }

      const { subject, html } = emailTemplates.connectAccountCompleteTemplate(data);

      // This is informational, not tracked in Notification table
      await emailClient.send({
        to: user.email,
        subject,
        html,
      });

      console.log('Connect account complete notification sent');
    } catch (error: any) {
      console.error('Error sending Connect account complete notification:', error);
      // Don't throw - not critical
    }
  }

  /**
   * List notifications for a user
   */
  async listNotifications(
    userId: string,
    filters: {
      type?: NotificationType;
      status?: NotificationStatus;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ notifications: any[]; total: number }> {
    const where: any = {
      recipientUserId: userId,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        notification_id: n.id,
        type: n.type,
        subject: n.subject,
        status: n.status,
        sent_at: n.sentAt?.toISOString() || null,
        created_at: n.createdAt.toISOString(),
      })),
      total,
    };
  }
}

export const notificationService = new NotificationService();
