import { env } from '../config/env';
import { baseEmailTemplate, formatCurrency, formatDate } from './email-base.template';

export interface InvoiceSentData {
  clientName: string;
  operatorName: string;
  operatorEmail: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date | string;
  projectName?: string;
  paymentTerms: string;
  invoiceUrl: string;
}

export function invoiceSentTemplate(data: InvoiceSentData): { subject: string; html: string } {
  const content = `
    <p>Hi ${data.clientName},</p>
    <p>${data.operatorName} has sent you an invoice for services rendered.</p>

    <div class="details-box">
      <h2>Invoice Details</h2>
      <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
      <p><strong>Amount Due:</strong> ${formatCurrency(data.amount, data.currency)}</p>
      <p><strong>Due Date:</strong> ${formatDate(data.dueDate)}</p>
      ${data.projectName ? `<p><strong>Project:</strong> ${data.projectName}</p>` : ''}
      <p><strong>Payment Terms:</strong> ${data.paymentTerms}</p>
    </div>

    <a href="${data.invoiceUrl}" class="cta-button">View and Pay Invoice</a>

    <p>A copy of the invoice is attached to this email for your records.</p>
    <p>If you have any questions, please contact ${data.operatorName} at ${data.operatorEmail}.</p>

    <p>Thank you,<br>The ${env.EMAIL_FROM_NAME} Team</p>
  `;

  return {
    subject: `New invoice from ${data.operatorName}: ${data.invoiceNumber}`,
    html: baseEmailTemplate(content),
  };
}

export interface PaymentConfirmationClientData {
  clientName: string;
  operatorName: string;
  operatorEmail: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paymentDate: Date | string;
  paymentMethod: string;
  receiptUrl: string;
}

export function paymentConfirmationClientTemplate(
  data: PaymentConfirmationClientData
): { subject: string; html: string } {
  const content = `
    <p>Hi ${data.clientName},</p>
    <p>Thank you! Your payment has been successfully processed.</p>

    <div class="details-box">
      <h2>Payment Details</h2>
      <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
      <p><strong>Amount Paid:</strong> ${formatCurrency(data.amount, data.currency)}</p>
      <p><strong>Payment Date:</strong> ${formatDate(data.paymentDate)}</p>
      <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
    </div>

    <a href="${data.receiptUrl}" class="cta-button">Download Receipt</a>

    <p>For your records, a receipt is attached to this email.</p>
    <p>If you have any questions, please contact ${data.operatorName} at ${data.operatorEmail}.</p>

    <p>Thank you,<br>The ${env.EMAIL_FROM_NAME} Team</p>
  `;

  return {
    subject: `Payment confirmed for invoice ${data.invoiceNumber}`,
    html: baseEmailTemplate(content),
  };
}

export interface PaymentConfirmationOperatorData {
  operatorName: string;
  clientName: string;
  invoiceNumber: string;
  grossAmount: number;
  currency: string;
  paymentDate: Date | string;
  netPayout: number;
  platformFee: number;
  expectedPayoutDate: Date | string;
  bankAccountLast4: string;
  payoutUrl: string;
}

export function paymentConfirmationOperatorTemplate(
  data: PaymentConfirmationOperatorData
): { subject: string; html: string } {
  const content = `
    <p>Hi ${data.operatorName},</p>
    <p>Great news! ${data.clientName} has paid invoice ${data.invoiceNumber}.</p>

    <div class="details-box">
      <h2>Payment Details</h2>
      <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
      <p><strong>Amount Received:</strong> ${formatCurrency(data.grossAmount, data.currency)} (before fees)</p>
      <p><strong>Payment Date:</strong> ${formatDate(data.paymentDate)}</p>
      <p><strong>Platform Fees:</strong> ${formatCurrency(data.platformFee, data.currency)}</p>
      <p><strong>Net Payout:</strong> ${formatCurrency(data.netPayout, data.currency)}</p>
      <p><strong>Expected Payout Date:</strong> ${formatDate(data.expectedPayoutDate)}</p>
    </div>

    <a href="${data.payoutUrl}" class="cta-button">View Payout Details</a>

    <p>Your funds will be transferred to your bank account (****${data.bankAccountLast4}) within 1-3 business days.</p>

    <p>Thank you,<br>The ${env.EMAIL_FROM_NAME} Team</p>
  `;

  return {
    subject: `Payment received for invoice ${data.invoiceNumber}`,
    html: baseEmailTemplate(content),
  };
}

export interface OverdueReminderData {
  clientName: string;
  operatorName: string;
  operatorEmail: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date | string;
  daysOverdue: number;
  projectName?: string;
  invoiceUrl: string;
}

export function overdueReminderTemplate(
  data: OverdueReminderData,
  reminderNumber: 1 | 2 | 3
): { subject: string; html: string } {
  const urgencyLevel = reminderNumber === 1 ? 'friendly' : reminderNumber === 2 ? 'urgent' : 'final';

  const subjectPrefixes = {
    1: 'Reminder',
    2: 'Second reminder',
    3: 'Final reminder',
  };

  const openings = {
    1: 'This is a friendly reminder that',
    2: 'We understand that oversights happen, but',
    3: 'Please take immediate action to settle this invoice as',
  };

  const content = `
    <p>Hi ${data.clientName},</p>
    <p>${openings[reminderNumber]} invoice ${data.invoiceNumber} ${
    reminderNumber === 1 ? 'was' : 'is now'
  } ${data.daysOverdue} day${data.daysOverdue > 1 ? 's' : ''} overdue.</p>

    <div class="details-box">
      <h2>Invoice Details</h2>
      <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
      <p><strong>Amount Due:</strong> ${formatCurrency(data.amount, data.currency)}</p>
      <p><strong>Original Due Date:</strong> ${formatDate(data.dueDate)}</p>
      <p><strong>Days Overdue:</strong> ${data.daysOverdue}</p>
      ${data.projectName ? `<p><strong>Project:</strong> ${data.projectName}</p>` : ''}
    </div>

    <a href="${data.invoiceUrl}" class="cta-button">Pay Now</a>

    <p>${
      reminderNumber === 3
        ? `If payment is not received soon, ${data.operatorName} may need to take further action. Please contact them at ${data.operatorEmail} if you have any concerns.`
        : `If you've already paid, please disregard this message. If you ${
            reminderNumber === 2 ? 'are experiencing difficulties with payment' : 'have any questions or need an extension'
          }, please contact ${data.operatorName} at ${data.operatorEmail}.`
    }</p>

    <p>Thank you,<br>The ${env.EMAIL_FROM_NAME} Team</p>
  `;

  return {
    subject: `${subjectPrefixes[reminderNumber]}: Invoice ${data.invoiceNumber} is ${
      reminderNumber === 1 ? 'now' : data.daysOverdue + ' days'
    } overdue`,
    html: baseEmailTemplate(content),
  };
}

export interface PayoutConfirmationData {
  operatorName: string;
  grossAmount: number;
  platformFee: number;
  netPayout: number;
  currency: string;
  bankAccountLast4: string;
  bankName: string;
  expectedArrival: string;
  payoutUrl: string;
}

export function payoutConfirmationTemplate(
  data: PayoutConfirmationData
): { subject: string; html: string } {
  const content = `
    <p>Hi ${data.operatorName},</p>
    <p>Your payout has been successfully processed and is on its way to your bank account.</p>

    <div class="details-box">
      <h2>Payout Details</h2>
      <p><strong>Gross Amount:</strong> ${formatCurrency(data.grossAmount, data.currency)}</p>
      <p><strong>Platform Fees:</strong> ${formatCurrency(data.platformFee, data.currency)}</p>
      <p><strong>Net Payout:</strong> ${formatCurrency(data.netPayout, data.currency)}</p>
      <p><strong>Bank Account:</strong> ****${data.bankAccountLast4} (${data.bankName})</p>
      <p><strong>Expected Arrival:</strong> ${data.expectedArrival}</p>
    </div>

    <a href="${data.payoutUrl}" class="cta-button">View Payout Details</a>

    <p>Funds typically arrive within 1-3 business days depending on your bank.</p>

    <p>Thank you,<br>The ${env.EMAIL_FROM_NAME} Team</p>
  `;

  return {
    subject: `Payout processed: ${formatCurrency(data.netPayout, data.currency)} on its way`,
    html: baseEmailTemplate(content),
  };
}

export interface PayoutFailedData {
  operatorName: string;
  netPayout: number;
  currency: string;
  invoiceNumber: string;
  bankAccountLast4: string;
  failureReason: string;
  updateBankUrl: string;
}

export function payoutFailedTemplate(data: PayoutFailedData): { subject: string; html: string } {
  const content = `
    <p>Hi ${data.operatorName},</p>
    <p>We were unable to process your payout of ${formatCurrency(data.netPayout, data.currency)}.</p>

    <div class="details-box">
      <h2>Payout Details</h2>
      <p><strong>Invoice:</strong> ${data.invoiceNumber}</p>
      <p><strong>Net Amount:</strong> ${formatCurrency(data.netPayout, data.currency)}</p>
      <p><strong>Bank Account:</strong> ****${data.bankAccountLast4}</p>
      <p><strong>Failure Reason:</strong> ${data.failureReason}</p>
    </div>

    <a href="${data.updateBankUrl}" class="cta-button">Update Bank Details</a>

    <p>Please update your bank account information to receive this payout. Your funds are safe and will be transferred once your account is corrected.</p>
    <p>If you need assistance, contact our support team at ${env.ADMIN_EMAIL}.</p>

    <p>Thank you,<br>The ${env.EMAIL_FROM_NAME} Team</p>
  `;

  return {
    subject: 'Action required: Payout failed',
    html: baseEmailTemplate(content),
  };
}

export interface ConnectAccountCompleteData {
  operatorName: string;
  bankAccountLast4: string;
  bankName: string;
  payoutSchedule: string;
  payoutSettingsUrl: string;
}

export function connectAccountCompleteTemplate(
  data: ConnectAccountCompleteData
): { subject: string; html: string } {
  const content = `
    <p>Hi ${data.operatorName},</p>
    <p>Great news! Your bank account has been successfully connected and verified. You can now receive payouts from your clients.</p>

    <div class="details-box">
      <h2>Bank Account Details</h2>
      <p><strong>Bank Account:</strong> ****${data.bankAccountLast4} (${data.bankName})</p>
      <p><strong>Payout Schedule:</strong> ${data.payoutSchedule}</p>
    </div>

    <a href="${data.payoutSettingsUrl}" class="cta-button">View Payout Settings</a>

    <p>All future invoice payments will be automatically transferred to your bank account after fees.</p>

    <p>Thank you,<br>The ${env.EMAIL_FROM_NAME} Team</p>
  `;

  return {
    subject: "Payouts enabled! You're ready to get paid",
    html: baseEmailTemplate(content),
  };
}
