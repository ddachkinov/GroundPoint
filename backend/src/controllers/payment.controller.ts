import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { PaymentStatus } from '@prisma/client';

export class PaymentController {
  /**
   * POST /api/v1/invoices/:id/payment-intent
   * Create a Payment Intent for an invoice
   */
  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const invoiceId = req.params.id;
      const { payment_method_types } = req.body;

      const result = await paymentService.createPaymentIntent(
        invoiceId,
        userId,
        payment_method_types || ['card']
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error creating payment intent:', error);

      if (error.message === 'Invoice not found') {
        res.status(404).json({ error: error.message });
      } else if (
        error.message === 'Not authorized to pay this invoice' ||
        error.message.includes('Status must be')
      ) {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to create payment intent' });
      }
    }
  }

  /**
   * GET /api/v1/payments/:id
   * Get payment details
   */
  async getPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const payment = await paymentService.getPayment(req.params.id, userId);

      res.json(payment);
    } catch (error: any) {
      console.error('Error getting payment:', error);

      if (error.message === 'Payment not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Not authorized to view this payment') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to get payment' });
      }
    }
  }

  /**
   * POST /api/v1/payments/:id/refund
   * Refund a payment (Superadmin only)
   */
  async refundPayment(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Add superadmin role check
      const userRole = req.user?.role;

      if (userRole !== 'SUPERADMIN') {
        res.status(403).json({ error: 'Only superadmins can refund payments' });
        return;
      }

      const { amount, reason } = req.body;

      const result = await paymentService.refundPayment(req.params.id, amount, reason);

      res.json(result);
    } catch (error: any) {
      console.error('Error refunding payment:', error);

      if (error.message === 'Payment not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Can only refund succeeded payments') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to refund payment' });
      }
    }
  }

  /**
   * GET /api/v1/payments
   * List payments for current user
   */
  async listPayments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const filters = {
        invoiceId: req.query.invoice_id as string | undefined,
        status: req.query.status as PaymentStatus | undefined,
      };

      const payments = await paymentService.listPayments(userId, filters);

      res.json({ payments });
    } catch (error: any) {
      console.error('Error listing payments:', error);
      res.status(500).json({ error: 'Failed to list payments' });
    }
  }
}

export const paymentController = new PaymentController();
