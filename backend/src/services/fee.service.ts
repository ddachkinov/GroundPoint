import { PrismaClient, FeeType, Prisma } from '@prisma/client';
import { env } from '../config/env';

const prisma = new PrismaClient();

// Default fee configuration (can be overridden via environment variables)
const PLATFORM_FEE_PERCENTAGE = env.PLATFORM_FEE_PERCENT / 100; // 5% = 0.05
const PLATFORM_FIXED_FEE = env.PLATFORM_FIXED_FEE; // $0.50

// Stripe fee estimates (actual fees fetched from Balance Transaction)
const STRIPE_CARD_PERCENTAGE = 0.029; // 2.9%
const STRIPE_CARD_FIXED = 0.30; // $0.30

export class FeeService {
  /**
   * Calculate platform and Stripe fees for a payment amount
   */
  calculateFees(amount: number): {
    platformPercentageFee: number;
    platformFixedFee: number;
    stripeEstimatedFee: number;
    totalFees: number;
    netAmount: number;
  } {
    // Platform fees
    const platformPercentageFee = amount * PLATFORM_FEE_PERCENTAGE;
    const platformFixedFee = PLATFORM_FIXED_FEE;

    // Stripe fees (estimated for cards)
    const stripeEstimatedFee = amount * STRIPE_CARD_PERCENTAGE + STRIPE_CARD_FIXED;

    // Totals
    const totalFees = platformPercentageFee + platformFixedFee + stripeEstimatedFee;
    const netAmount = amount - totalFees;

    return {
      platformPercentageFee: Number(platformPercentageFee.toFixed(2)),
      platformFixedFee: Number(platformFixedFee.toFixed(2)),
      stripeEstimatedFee: Number(stripeEstimatedFee.toFixed(2)),
      totalFees: Number(totalFees.toFixed(2)),
      netAmount: Number(netAmount.toFixed(2)),
    };
  }

  /**
   * Create fee records for a payment
   */
  async createFeeRecords(
    paymentId: string,
    amount: number,
    currency: string
  ): Promise<void> {
    const fees = this.calculateFees(amount);

    // Create three fee records: platform percentage, platform fixed, and Stripe processing
    await prisma.$transaction([
      // Platform percentage fee
      prisma.fee.create({
        data: {
          paymentId,
          feeType: FeeType.PLATFORM_PERCENTAGE,
          amount: new Prisma.Decimal(fees.platformPercentageFee.toFixed(2)),
          currency,
        },
      }),
      // Platform fixed fee
      prisma.fee.create({
        data: {
          paymentId,
          feeType: FeeType.PLATFORM_FIXED,
          amount: new Prisma.Decimal(fees.platformFixedFee.toFixed(2)),
          currency,
        },
      }),
      // Stripe processing fee (estimated)
      prisma.fee.create({
        data: {
          paymentId,
          feeType: FeeType.STRIPE_PROCESSING,
          amount: new Prisma.Decimal(fees.stripeEstimatedFee.toFixed(2)),
          currency,
        },
      }),
    ]);

    console.log(`Fee records created for payment ${paymentId}`);
  }

  /**
   * Get fee breakdown for a payment
   */
  async getPaymentFees(paymentId: string): Promise<any[]> {
    const fees = await prisma.fee.findMany({
      where: { paymentId },
      orderBy: { feeType: 'asc' },
    });

    return fees.map((fee) => ({
      fee_id: fee.id,
      fee_type: fee.feeType,
      amount: Number(fee.amount),
      currency: fee.currency,
      calculated_at: fee.calculatedAt.toISOString(),
    }));
  }

  /**
   * List fees for an operator organization
   */
  async listFees(
    operatorOrgId: string,
    filters: {
      paymentId?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ fees: any[]; total: number }> {
    const limit = Math.min(filters.limit || 50, 100);
    const offset = filters.offset || 0;

    // Build where clause
    const where: any = {
      payment: {
        invoice: {
          operatorOrgId,
        },
      },
    };

    if (filters.paymentId) {
      where.paymentId = filters.paymentId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.calculatedAt = {};
      if (filters.dateFrom) {
        where.calculatedAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.calculatedAt.lte = new Date(filters.dateTo);
      }
    }

    const [fees, total] = await Promise.all([
      prisma.fee.findMany({
        where,
        include: {
          payment: {
            include: {
              invoice: {
                select: {
                  invoiceNumber: true,
                },
              },
            },
          },
        },
        orderBy: { calculatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.fee.count({ where }),
    ]);

    return {
      fees: fees.map((fee) => ({
        fee_id: fee.id,
        payment_id: fee.paymentId,
        invoice_number: fee.payment.invoice.invoiceNumber,
        fee_type: fee.feeType,
        amount: Number(fee.amount),
        currency: fee.currency,
        calculated_at: fee.calculatedAt.toISOString(),
      })),
      total,
    };
  }

  /**
   * Get monthly fee summary for an operator
   */
  async getMonthlyFeeSummary(
    operatorOrgId: string,
    month: string // Format: YYYY-MM
  ): Promise<{
    month: string;
    gross_revenue: number;
    platform_fees: number;
    stripe_fees: number;
    net_earnings: number;
    transaction_count: number;
  }> {
    // Parse month
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59); // Last day of month

    // Get all payments for the month
    const payments = await prisma.payment.findMany({
      where: {
        invoice: {
          operatorOrgId,
        },
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'SUCCEEDED',
      },
      include: {
        fees: true,
      },
    });

    // Calculate summary
    let grossRevenue = 0;
    let platformFees = 0;
    let stripeFees = 0;

    payments.forEach((payment) => {
      grossRevenue += Number(payment.amount);

      payment.fees.forEach((fee) => {
        if (fee.feeType === FeeType.PLATFORM_PERCENTAGE || fee.feeType === FeeType.PLATFORM_FIXED) {
          platformFees += Number(fee.amount);
        } else if (fee.feeType === FeeType.STRIPE_PROCESSING) {
          stripeFees += Number(fee.amount);
        }
      });
    });

    const netEarnings = grossRevenue - platformFees - stripeFees;

    return {
      month,
      gross_revenue: Number(grossRevenue.toFixed(2)),
      platform_fees: Number(platformFees.toFixed(2)),
      stripe_fees: Number(stripeFees.toFixed(2)),
      net_earnings: Number(netEarnings.toFixed(2)),
      transaction_count: payments.length,
    };
  }

  /**
   * Get fee reconciliation report (Superadmin only)
   */
  async getReconciliationReport(
    dateFrom: string,
    dateTo: string
  ): Promise<{
    date_from: string;
    date_to: string;
    total_payments: number;
    total_gross_amount: number;
    total_platform_fees: number;
    total_stripe_fees: number;
    total_net_payouts: number;
    discrepancies: any[];
  }> {
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);

    // Get all succeeded payments in date range
    const payments = await prisma.payment.findMany({
      where: {
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'SUCCEEDED',
      },
      include: {
        fees: true,
        payouts: true,
      },
    });

    let totalGrossAmount = 0;
    let totalPlatformFees = 0;
    let totalStripeFees = 0;
    let totalNetPayouts = 0;

    payments.forEach((payment) => {
      totalGrossAmount += Number(payment.amount);

      payment.fees.forEach((fee) => {
        if (fee.feeType === FeeType.PLATFORM_PERCENTAGE || fee.feeType === FeeType.PLATFORM_FIXED) {
          totalPlatformFees += Number(fee.amount);
        } else if (fee.feeType === FeeType.STRIPE_PROCESSING) {
          totalStripeFees += Number(fee.amount);
        }
      });

      payment.payouts.forEach((payout) => {
        totalNetPayouts += Number(payout.netAmount);
      });
    });

    // Check for discrepancies (gross - fees should equal net payouts)
    const expectedNetPayouts = totalGrossAmount - totalPlatformFees - totalStripeFees;
    const discrepancy = Math.abs(expectedNetPayouts - totalNetPayouts);

    const discrepancies = [];
    if (discrepancy > 0.10) {
      // More than 10 cents difference
      discrepancies.push({
        type: 'payout_mismatch',
        expected: expectedNetPayouts.toFixed(2),
        actual: totalNetPayouts.toFixed(2),
        difference: discrepancy.toFixed(2),
      });
    }

    return {
      date_from: dateFrom,
      date_to: dateTo,
      total_payments: payments.length,
      total_gross_amount: Number(totalGrossAmount.toFixed(2)),
      total_platform_fees: Number(totalPlatformFees.toFixed(2)),
      total_stripe_fees: Number(totalStripeFees.toFixed(2)),
      total_net_payouts: Number(totalNetPayouts.toFixed(2)),
      discrepancies,
    };
  }

  /**
   * Get fee breakdown for a payout
   */
  async getPayoutFeeBreakdown(payoutId: string): Promise<any> {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        payment: {
          include: {
            fees: true,
          },
        },
      },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    const payment = payout.payment;
    const fees = payment.fees;

    // Organize fees by type
    let platformPercentageFee = 0;
    let platformFixedFee = 0;
    let stripeFee = 0;

    fees.forEach((fee) => {
      if (fee.feeType === FeeType.PLATFORM_PERCENTAGE) {
        platformPercentageFee = Number(fee.amount);
      } else if (fee.feeType === FeeType.PLATFORM_FIXED) {
        platformFixedFee = Number(fee.amount);
      } else if (fee.feeType === FeeType.STRIPE_PROCESSING) {
        stripeFee = Number(fee.amount);
      }
    });

    return {
      gross_amount: Number(payment.amount),
      platform_percentage_fee: platformPercentageFee,
      platform_fixed_fee: platformFixedFee,
      stripe_processing_fee: stripeFee,
      total_fees: platformPercentageFee + platformFixedFee + stripeFee,
      net_payout: Number(payout.netAmount),
      currency: payout.currency,
    };
  }
}

export const feeService = new FeeService();
