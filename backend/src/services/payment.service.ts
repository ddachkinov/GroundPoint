import { PrismaClient, PaymentStatus, PaymentMethod, InvoiceStatus, Prisma } from '@prisma/client';
import { stripeClient } from '../config/stripe.config';
import Stripe from 'stripe';
import { payoutService } from './payout.service';
import { notificationService } from './notification.service';
import { feeService } from './fee.service';
import { env } from '../config/env';

const prisma = new PrismaClient();

export class PaymentService {
  /**
   * Create a Payment Intent for an invoice
   */
  async createPaymentIntent(
    invoiceId: string,
    userId: string,
    paymentMethodTypes: string[] = ['card']
  ): Promise<{ client_secret: string; payment_intent_id: string; amount: number; currency: string }> {
    // Get invoice with authorization check
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        siteOwnerOrg: true,
        operatorOrg: true,
        project: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Verify user has access to this invoice (Site Owner organization)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.siteOwnerOrganizationId !== invoice.siteOwnerOrgId) {
      throw new Error('Not authorized to pay this invoice');
    }

    // Check invoice status
    if (invoice.status !== InvoiceStatus.SENT && invoice.status !== InvoiceStatus.OVERDUE) {
      throw new Error('Invoice cannot be paid. Status must be SENT or OVERDUE');
    }

    // Check if Payment Intent already exists (idempotency)
    if (invoice.stripePaymentIntentId) {
      try {
        const existingIntent = await stripeClient.paymentIntents.retrieve(
          invoice.stripePaymentIntentId
        );

        // If intent is still usable, return it
        if (
          existingIntent.status !== 'succeeded' &&
          existingIntent.status !== 'canceled'
        ) {
          return {
            client_secret: existingIntent.client_secret!,
            payment_intent_id: existingIntent.id,
            amount: existingIntent.amount,
            currency: existingIntent.currency,
          };
        }
      } catch (error) {
        // Intent doesn't exist or was deleted, create new one
        console.log('Existing payment intent not found, creating new one');
      }
    }

    // Convert amount to cents (Stripe requires smallest currency unit)
    const amountInCents = Math.round(Number(invoice.totalAmount) * 100);

    // Create Payment Intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountInCents,
      currency: invoice.currency.toLowerCase(),
      payment_method_types: paymentMethodTypes as Stripe.PaymentIntentCreateParams.PaymentMethodType[],
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        operator_org_id: invoice.operatorOrgId,
        site_owner_org_id: invoice.siteOwnerOrgId,
        project_id: invoice.projectId || '',
      },
      receipt_email: user.email,
      description: `Payment for invoice ${invoice.invoiceNumber}`,
    });

    // Store payment intent ID in invoice for idempotency
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return {
      client_secret: paymentIntent.client_secret!,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  }

  /**
   * Handle payment_intent.succeeded webhook event
   */
  async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const invoiceId = paymentIntent.metadata.invoice_id;

    if (!invoiceId) {
      console.error('Payment Intent missing invoice_id in metadata', paymentIntent.id);
      return;
    }

    // Check if payment already processed (idempotency)
    const existingPayment = await prisma.payment.findFirst({
      where: {
        stripePaymentIntentId: paymentIntent.id,
        status: PaymentStatus.SUCCEEDED,
      },
    });

    if (existingPayment) {
      console.log('Payment already processed', paymentIntent.id);
      return;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      console.error('Invoice not found for payment', invoiceId);
      return;
    }

    // Extract payment method details
    const charge = paymentIntent.charges.data[0];
    const paymentMethodDetails = charge?.payment_method_details;

    let paymentMethod: PaymentMethod = PaymentMethod.CARD;
    if (paymentMethodDetails?.type === 'sepa_debit') {
      paymentMethod = PaymentMethod.SEPA;
    } else if (paymentMethodDetails?.type === 'bank_transfer') {
      paymentMethod = PaymentMethod.BANK_TRANSFER;
    }

    // Get user ID from invoice
    const user = await prisma.user.findFirst({
      where: {
        siteOwnerOrganizationId: invoice.siteOwnerOrgId,
      },
    });

    if (!user) {
      console.error('No user found for site owner organization', invoice.siteOwnerOrgId);
      return;
    }

    // Create payment record and update invoice in a transaction
    const payment = await prisma.$transaction(async (tx) => {
      // Create payment record
      const newPayment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          siteOwnerUserId: user.id,
          amount: new Prisma.Decimal((paymentIntent.amount / 100).toFixed(2)),
          currency: paymentIntent.currency.toUpperCase(),
          paymentMethod,
          stripePaymentIntentId: paymentIntent.id,
          stripeChargeId: charge?.id || null,
          status: PaymentStatus.SUCCEEDED,
          paidAt: new Date(),
        },
      });

      // Update invoice status to PAID
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
        },
      });

      return newPayment;
    });

    console.log(`Payment succeeded for invoice ${invoice.invoiceNumber}`);

    // Create fee records for this payment
    try {
      await feeService.createFeeRecords(
        payment.id,
        Number(payment.amount),
        payment.currency
      );
    } catch (error) {
      console.error('Error creating fee records:', error);
      // Don't fail payment if fee record creation fails
    }

    // Create payout for operator
    let payoutId: string | undefined;
    try {
      const payout = await payoutService.createPayout(payment.id);
      payoutId = payout.payout_id;
    } catch (error) {
      console.error('Error creating payout:', error);
      // Don't fail payment if payout creation fails
    }

    // Send payment confirmation emails
    try {
      // Get operator and site owner users
      const [operatorUser, siteOwnerUser] = await Promise.all([
        prisma.user.findFirst({
          where: { operatorOrganizationId: invoice.operatorOrgId },
        }),
        prisma.user.findFirst({
          where: { siteOwnerOrganizationId: invoice.siteOwnerOrgId },
        }),
      ]);

      // Get operator and site owner orgs
      const [operatorOrg, siteOwnerOrg] = await Promise.all([
        prisma.organization.findUnique({
          where: { id: invoice.operatorOrgId },
        }),
        prisma.organization.findUnique({
          where: { id: invoice.siteOwnerOrgId },
        }),
      ]);

      // Get payment method details
      let paymentMethodDetails = 'Card';
      if (paymentMethodDetails?.type === 'card') {
        const card = charge?.payment_method_details?.card;
        if (card) {
          paymentMethodDetails = `${card.brand} ending in ${card.last4}`;
        }
      }

      // Send confirmation to client
      if (siteOwnerUser && operatorOrg) {
        await notificationService.sendPaymentConfirmationClient(siteOwnerUser.id, {
          clientName: siteOwnerOrg?.name || 'Customer',
          operatorName: operatorOrg.name,
          operatorEmail: operatorUser?.email || env.ADMIN_EMAIL,
          invoiceNumber: invoice.invoiceNumber,
          amount: Number(payment.amount),
          currency: payment.currency,
          paymentDate: payment.paidAt || new Date(),
          paymentMethod: paymentMethodDetails,
          receiptUrl: `${env.FRONTEND_URL}/payments/${payment.id}`,
        });
      }

      // Send confirmation to operator
      if (operatorUser && siteOwnerOrg && payoutId) {
        // Get payout details for notification
        const payout = await prisma.payout.findUnique({
          where: { id: payoutId },
        });

        if (payout) {
          const scheduledDate = payout.scheduledAt || new Date();
          scheduledDate.setDate(scheduledDate.getDate() + 1);

          // Get bank account last 4 digits
          const operatorOrgFull = await prisma.organization.findUnique({
            where: { id: invoice.operatorOrgId },
          });
          const bankAccountLast4 = operatorOrgFull?.stripeConnectedAccountId?.slice(-4) || '****';

          await notificationService.sendPaymentConfirmationOperator(operatorUser.id, {
            operatorName: operatorOrg?.name || 'Operator',
            clientName: siteOwnerOrg.name,
            invoiceNumber: invoice.invoiceNumber,
            grossAmount: Number(payment.amount),
            currency: payment.currency,
            paymentDate: payment.paidAt || new Date(),
            netPayout: Number(payout.netAmount),
            platformFee: Number(payout.platformFee),
            expectedPayoutDate: scheduledDate,
            bankAccountLast4,
            payoutUrl: `${env.FRONTEND_URL}/payouts/${payoutId}`,
          });
        }
      }
    } catch (error) {
      console.error('Error sending payment confirmation emails:', error);
      // Don't fail payment if notifications fail
    }
  }

  /**
   * Handle payment_intent.payment_failed webhook event
   */
  async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const invoiceId = paymentIntent.metadata.invoice_id;

    if (!invoiceId) {
      console.error('Payment Intent missing invoice_id in metadata', paymentIntent.id);
      return;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      console.error('Invoice not found for payment', invoiceId);
      return;
    }

    // Get user ID from invoice
    const user = await prisma.user.findFirst({
      where: {
        siteOwnerOrganizationId: invoice.siteOwnerOrgId,
      },
    });

    if (!user) {
      console.error('No user found for site owner organization', invoice.siteOwnerOrgId);
      return;
    }

    // Extract failure reason
    const lastPaymentError = paymentIntent.last_payment_error;
    const failureReason = lastPaymentError?.message || 'Payment failed';

    // Create failed payment record
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        siteOwnerUserId: user.id,
        amount: new Prisma.Decimal((paymentIntent.amount / 100).toFixed(2)),
        currency: paymentIntent.currency.toUpperCase(),
        paymentMethod: PaymentMethod.CARD, // Default to CARD
        stripePaymentIntentId: paymentIntent.id,
        status: PaymentStatus.FAILED,
        failureReason,
      },
    });

    console.log(`Payment failed for invoice ${invoice.invoiceNumber}: ${failureReason}`);

    // TODO: Send notification email to Site Owner (TASK_12)
  }

  /**
   * Handle charge.refunded webhook event
   */
  async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      console.error('Charge missing payment_intent', charge.id);
      return;
    }

    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
      },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      console.error('Payment not found for charge', charge.id);
      return;
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
      },
    });

    // Update invoice status
    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        status: InvoiceStatus.REFUNDED,
      },
    });

    console.log(`Charge refunded for invoice ${payment.invoice.invoiceNumber}`);

    // TODO: Send notification emails (TASK_12)
    // TODO: Reverse payout to Operator (TASK_11)
  }

  /**
   * Get payment details
   */
  async getPayment(paymentId: string, userId: string): Promise<any> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            operatorOrg: true,
            siteOwnerOrg: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Verify user has access
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const hasAccess =
      user.operatorOrganizationId === payment.invoice.operatorOrgId ||
      user.siteOwnerOrganizationId === payment.invoice.siteOwnerOrgId;

    if (!hasAccess) {
      throw new Error('Not authorized to view this payment');
    }

    // Get payment method details from Stripe
    let paymentMethodDetails = 'Card';
    let receiptUrl: string | null = null;

    try {
      const paymentIntent = await stripeClient.paymentIntents.retrieve(
        payment.stripePaymentIntentId
      );

      const charge = paymentIntent.charges.data[0];
      if (charge) {
        receiptUrl = charge.receipt_url;

        if (charge.payment_method_details?.card) {
          const card = charge.payment_method_details.card;
          paymentMethodDetails = `${card.brand} ending in ${card.last4}`;
        } else if (charge.payment_method_details?.sepa_debit) {
          const sepa = charge.payment_method_details.sepa_debit;
          paymentMethodDetails = `SEPA ending in ${sepa.last4}`;
        }
      }
    } catch (error) {
      console.error('Error fetching payment details from Stripe:', error);
    }

    return {
      payment_id: payment.id,
      invoice_id: payment.invoiceId,
      invoice_number: payment.invoice.invoiceNumber,
      amount: Number(payment.amount),
      currency: payment.currency,
      payment_method: payment.paymentMethod,
      payment_method_details: paymentMethodDetails,
      status: payment.status,
      paid_at: payment.paidAt?.toISOString() || null,
      receipt_url: receiptUrl,
      failure_reason: payment.failureReason,
      created_at: payment.createdAt.toISOString(),
    };
  }

  /**
   * Refund a payment (Superadmin only)
   */
  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<{ refund_id: string; amount: number; status: string }> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new Error('Can only refund succeeded payments');
    }

    // Calculate refund amount
    const refundAmount = amount
      ? Math.round(amount * 100)
      : Math.round(Number(payment.amount) * 100);

    // Create refund in Stripe
    const refund = await stripeClient.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: refundAmount,
      reason: reason as Stripe.RefundCreateParams.Reason | undefined,
    });

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
      },
    });

    // Update invoice status
    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: {
        status: InvoiceStatus.REFUNDED,
      },
    });

    return {
      refund_id: refund.id,
      amount: refund.amount / 100,
      status: 'Refunded',
    };
  }

  /**
   * List payments for a user
   */
  async listPayments(
    userId: string,
    filters: { invoiceId?: string; status?: PaymentStatus } = {}
  ): Promise<any[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const where: any = {};

    // Filter by organization access
    if (user.operatorOrganizationId) {
      where.invoice = {
        operatorOrgId: user.operatorOrganizationId,
      };
    } else if (user.siteOwnerOrganizationId) {
      where.invoice = {
        siteOwnerOrgId: user.siteOwnerOrganizationId,
      };
    } else {
      return [];
    }

    // Additional filters
    if (filters.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        invoice: {
          include: {
            operatorOrg: {
              select: { name: true },
            },
            siteOwnerOrg: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return payments.map((payment) => ({
      payment_id: payment.id,
      invoice_id: payment.invoiceId,
      invoice_number: payment.invoice.invoiceNumber,
      operator_name: payment.invoice.operatorOrg.name,
      site_owner_name: payment.invoice.siteOwnerOrg.name,
      amount: Number(payment.amount),
      currency: payment.currency,
      payment_method: payment.paymentMethod,
      status: payment.status,
      paid_at: payment.paidAt?.toISOString() || null,
      created_at: payment.createdAt.toISOString(),
    }));
  }
}

export const paymentService = new PaymentService();
