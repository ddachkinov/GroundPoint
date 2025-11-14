import { PrismaClient, PayoutStatus, Prisma } from '@prisma/client';
import { stripeClient } from '../config/stripe.config';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Platform fee configuration (5% + $0.50)
const PLATFORM_FEE_PERCENTAGE = 0.05;
const PLATFORM_FEE_FIXED = 0.50;

export class PayoutService {
  /**
   * Create or retrieve Stripe Connect account for an operator
   */
  async createConnectAccount(
    operatorOrgId: string,
    refreshUrl: string,
    returnUrl: string
  ): Promise<{ account_link_url: string; connected_account_id: string }> {
    const organization = await prisma.organization.findUnique({
      where: { id: operatorOrgId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    let accountId = organization.stripeConnectedAccountId;

    // Create new Stripe account if doesn't exist
    if (!accountId) {
      const account = await stripeClient.accounts.create({
        type: 'express',
        country: organization.countryCode || 'US',
        email: `payouts@${organization.name.toLowerCase().replace(/\s/g, '')}.com`, // Placeholder
        capabilities: {
          transfers: { requested: true },
        },
        metadata: {
          organization_id: operatorOrgId,
          organization_name: organization.name,
        },
      });

      accountId = account.id;

      // Store connected account ID
      await prisma.organization.update({
        where: { id: operatorOrgId },
        data: {
          stripeConnectedAccountId: accountId,
        },
      });
    }

    // Generate account link for onboarding
    const accountLink = await stripeClient.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return {
      account_link_url: accountLink.url,
      connected_account_id: accountId,
    };
  }

  /**
   * Get Connect account status
   */
  async getConnectAccountStatus(operatorOrgId: string): Promise<{
    connected_account_id: string | null;
    onboarding_complete: boolean;
    payouts_enabled: boolean;
    bank_account_last4: string | null;
    bank_name: string | null;
  }> {
    const organization = await prisma.organization.findUnique({
      where: { id: operatorOrgId },
    });

    if (!organization || !organization.stripeConnectedAccountId) {
      return {
        connected_account_id: null,
        onboarding_complete: false,
        payouts_enabled: false,
        bank_account_last4: null,
        bank_name: null,
      };
    }

    try {
      const account = await stripeClient.accounts.retrieve(
        organization.stripeConnectedAccountId
      );

      const payoutsEnabled = account.payouts_enabled || false;
      const onboardingComplete = account.details_submitted || false;

      // Get bank account details
      let bankAccountLast4: string | null = null;
      let bankName: string | null = null;

      if (account.external_accounts && account.external_accounts.data.length > 0) {
        const bankAccount = account.external_accounts.data[0];
        if (bankAccount.object === 'bank_account') {
          bankAccountLast4 = (bankAccount as Stripe.BankAccount).last4;
          bankName = (bankAccount as Stripe.BankAccount).bank_name || null;
        }
      }

      return {
        connected_account_id: organization.stripeConnectedAccountId,
        onboarding_complete: onboardingComplete,
        payouts_enabled: payoutsEnabled,
        bank_account_last4: bankAccountLast4,
        bank_name: bankName,
      };
    } catch (error) {
      console.error('Error retrieving Connect account:', error);
      return {
        connected_account_id: organization.stripeConnectedAccountId,
        onboarding_complete: false,
        payouts_enabled: false,
        bank_account_last4: null,
        bank_name: null,
      };
    }
  }

  /**
   * Create payout record after successful payment
   */
  async createPayout(paymentId: string): Promise<void> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: {
            operatorOrg: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'SUCCEEDED') {
      throw new Error('Can only create payouts for succeeded payments');
    }

    // Check if payout already exists
    const existingPayout = await prisma.payout.findFirst({
      where: { paymentId },
    });

    if (existingPayout) {
      console.log('Payout already exists for payment', paymentId);
      return;
    }

    const operatorOrg = payment.invoice.operatorOrg;

    if (!operatorOrg.stripeConnectedAccountId) {
      console.log('Operator has no connected account, skipping payout creation');
      return;
    }

    // Calculate fees and net amount
    const grossAmount = Number(payment.amount);
    const feeAmount = this.calculateFee(grossAmount);
    const netAmount = grossAmount - feeAmount;

    // Schedule payout for T+1 (next day)
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 1);
    scheduledAt.setHours(0, 0, 0, 0);

    // Create payout record
    await prisma.payout.create({
      data: {
        operatorOrgId: operatorOrg.id,
        paymentId: payment.id,
        grossAmount: new Prisma.Decimal(grossAmount.toFixed(2)),
        feeAmount: new Prisma.Decimal(feeAmount.toFixed(2)),
        netAmount: new Prisma.Decimal(netAmount.toFixed(2)),
        currency: payment.currency,
        stripeConnectedAccountId: operatorOrg.stripeConnectedAccountId,
        status: PayoutStatus.PENDING,
        scheduledAt,
      },
    });

    console.log(`Payout created for payment ${paymentId}, scheduled for ${scheduledAt}`);

    // TODO: Enqueue background job to process payout at scheduled time
  }

  /**
   * Process a pending payout via Stripe Transfer
   */
  async processPayout(payoutId: string): Promise<void> {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        payment: {
          include: {
            invoice: true,
          },
        },
        operatorOrg: true,
      },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.status !== PayoutStatus.PENDING) {
      throw new Error('Payout is not in PENDING status');
    }

    if (!payout.payment.stripePaymentIntentId) {
      throw new Error('Payment has no Stripe Payment Intent ID');
    }

    try {
      // Create Stripe Transfer to Connected Account
      const amountInCents = Math.round(Number(payout.netAmount) * 100);

      const transfer = await stripeClient.transfers.create({
        amount: amountInCents,
        currency: payout.currency.toLowerCase(),
        destination: payout.stripeConnectedAccountId,
        source_transaction: payout.payment.stripeChargeId || undefined,
        description: `Payout for invoice ${payout.payment.invoice.invoiceNumber}`,
        metadata: {
          payout_id: payout.id,
          payment_id: payout.payment.id,
          invoice_id: payout.payment.invoiceId,
          operator_org_id: payout.operatorOrgId,
        },
      });

      // Update payout with transfer ID and status
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          stripeTransferId: transfer.id,
          status: PayoutStatus.IN_TRANSIT,
        },
      });

      console.log(`Payout ${payoutId} processed, transfer ${transfer.id} created`);
    } catch (error: any) {
      console.error('Error processing payout:', error);

      // Update payout with failure info
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.FAILED,
          failureReason: error.message || 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Handle transfer.paid webhook (payout arrived in connected account)
   */
  async handleTransferPaid(transfer: Stripe.Transfer): Promise<void> {
    const payoutId = transfer.metadata?.payout_id;

    if (!payoutId) {
      console.error('Transfer missing payout_id in metadata', transfer.id);
      return;
    }

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      console.error('Payout not found for transfer', transfer.id);
      return;
    }

    // Update payout status to PAID
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.PAID,
        paidAt: new Date(),
      },
    });

    console.log(`Payout ${payoutId} marked as PAID`);

    // TODO: Send email notification to operator (TASK_12)
  }

  /**
   * List payouts for an operator
   */
  async listPayouts(
    operatorOrgId: string,
    filters: {
      status?: PayoutStatus;
      date_from?: string;
      date_to?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ payouts: any[]; total: number; limit: number; offset: number }> {
    const limit = Math.min(filters.limit || 50, 100);
    const offset = filters.offset || 0;

    const where: any = {
      operatorOrgId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.date_from || filters.date_to) {
      where.scheduledAt = {};
      if (filters.date_from) {
        where.scheduledAt.gte = new Date(filters.date_from);
      }
      if (filters.date_to) {
        where.scheduledAt.lte = new Date(filters.date_to);
      }
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          payment: {
            include: {
              invoice: {
                select: {
                  invoiceNumber: true,
                  siteOwnerOrg: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          scheduledAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.payout.count({ where }),
    ]);

    return {
      payouts: payouts.map((payout) => ({
        payout_id: payout.id,
        payment_id: payout.paymentId,
        invoice_id: payout.payment.invoiceId,
        invoice_number: payout.payment.invoice.invoiceNumber,
        site_owner_org_name: payout.payment.invoice.siteOwnerOrg.name,
        gross_amount: Number(payout.grossAmount),
        fee_amount: Number(payout.feeAmount),
        net_amount: Number(payout.netAmount),
        currency: payout.currency,
        status: payout.status,
        scheduled_at: payout.scheduledAt.toISOString(),
        paid_at: payout.paidAt?.toISOString() || null,
        stripe_transfer_id: payout.stripeTransferId,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get single payout details
   */
  async getPayout(payoutId: string, operatorOrgId: string): Promise<any> {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        payment: {
          include: {
            invoice: {
              include: {
                siteOwnerOrg: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        operatorOrg: {
          select: {
            name: true,
            stripeConnectedAccountId: true,
          },
        },
      },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    if (payout.operatorOrgId !== operatorOrgId) {
      throw new Error('Not authorized to view this payout');
    }

    // Get bank account info if available
    let bankAccountLast4: string | null = null;
    if (payout.operatorOrg.stripeConnectedAccountId) {
      const status = await this.getConnectAccountStatus(operatorOrgId);
      bankAccountLast4 = status.bank_account_last4;
    }

    return {
      payout_id: payout.id,
      operator_org_id: payout.operatorOrgId,
      payment_id: payout.paymentId,
      invoice_id: payout.payment.invoiceId,
      invoice_number: payout.payment.invoice.invoiceNumber,
      site_owner_org_name: payout.payment.invoice.siteOwnerOrg.name,
      gross_amount: Number(payout.grossAmount),
      fee_amount: Number(payout.feeAmount),
      net_amount: Number(payout.netAmount),
      currency: payout.currency,
      status: payout.status,
      scheduled_at: payout.scheduledAt.toISOString(),
      paid_at: payout.paidAt?.toISOString() || null,
      stripe_transfer_id: payout.stripeTransferId,
      failure_reason: payout.failureReason,
      bank_account_last4: bankAccountLast4,
      created_at: payout.createdAt.toISOString(),
    };
  }

  /**
   * Get payout dashboard metrics
   */
  async getDashboardMetrics(operatorOrgId: string): Promise<{
    total_lifetime_earnings: number;
    total_this_month: number;
    pending_payouts: number;
    next_payout_date: string | null;
    next_payout_amount: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total lifetime earnings (all PAID payouts)
    const lifetimeResult = await prisma.payout.aggregate({
      where: {
        operatorOrgId,
        status: PayoutStatus.PAID,
      },
      _sum: {
        netAmount: true,
      },
    });

    // This month earnings
    const thisMonthResult = await prisma.payout.aggregate({
      where: {
        operatorOrgId,
        status: PayoutStatus.PAID,
        paidAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        netAmount: true,
      },
    });

    // Pending payouts total
    const pendingResult = await prisma.payout.aggregate({
      where: {
        operatorOrgId,
        status: {
          in: [PayoutStatus.PENDING, PayoutStatus.IN_TRANSIT],
        },
      },
      _sum: {
        netAmount: true,
      },
    });

    // Next payout
    const nextPayout = await prisma.payout.findFirst({
      where: {
        operatorOrgId,
        status: PayoutStatus.PENDING,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return {
      total_lifetime_earnings: Number(lifetimeResult._sum.netAmount || 0),
      total_this_month: Number(thisMonthResult._sum.netAmount || 0),
      pending_payouts: Number(pendingResult._sum.netAmount || 0),
      next_payout_date: nextPayout?.scheduledAt.toISOString().split('T')[0] || null,
      next_payout_amount: nextPayout ? Number(nextPayout.netAmount) : 0,
    };
  }

  /**
   * Calculate platform fee
   */
  private calculateFee(grossAmount: number): number {
    return grossAmount * PLATFORM_FEE_PERCENTAGE + PLATFORM_FEE_FIXED;
  }
}

export const payoutService = new PayoutService();
