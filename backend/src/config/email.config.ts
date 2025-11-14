import { env } from './env';

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

/**
 * Generic email client that can work with SendGrid, Postmark, or similar services
 * Uses SendGrid Web API v3 by default
 */
export class EmailClient {
  private apiKey: string;
  private fromAddress: string;
  private fromName: string;

  constructor() {
    this.apiKey = env.EMAIL_API_KEY;
    this.fromAddress = env.EMAIL_FROM_ADDRESS;
    this.fromName = env.EMAIL_FROM_NAME;
  }

  /**
   * Send an email using SendGrid Web API v3
   */
  async send(options: EmailOptions): Promise<{ messageId: string }> {
    try {
      // Prepare email payload for SendGrid
      const payload = {
        personalizations: [
          {
            to: [{ email: options.to }],
          },
        ],
        from: {
          email: this.fromAddress,
          name: this.fromName,
        },
        subject: options.subject,
        content: [
          {
            type: 'text/html',
            value: options.html,
          },
        ],
        ...(options.text && {
          content: [
            {
              type: 'text/plain',
              value: options.text,
            },
            {
              type: 'text/html',
              value: options.html,
            },
          ],
        }),
        ...(options.replyTo && {
          reply_to: { email: options.replyTo },
        }),
        ...(options.attachments &&
          options.attachments.length > 0 && {
            attachments: options.attachments.map((att) => ({
              filename: att.filename,
              content: Buffer.isBuffer(att.content)
                ? att.content.toString('base64')
                : att.content,
              type: att.contentType || 'application/octet-stream',
              disposition: 'attachment',
            })),
          }),
      };

      // Send via SendGrid API
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SendGrid API error: ${response.status} ${error}`);
      }

      // SendGrid returns message ID in X-Message-Id header
      const messageId = response.headers.get('X-Message-Id') || `msg_${Date.now()}`;

      console.log(`Email sent successfully to ${options.to}: ${messageId}`);

      return { messageId };
    } catch (error: any) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send multiple emails in batch (for overdue reminders, etc.)
   */
  async sendBatch(emails: EmailOptions[]): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        await this.send(email);
        sent++;
      } catch (error) {
        console.error(`Failed to send email to ${email.to}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }
}

export const emailClient = new EmailClient();
