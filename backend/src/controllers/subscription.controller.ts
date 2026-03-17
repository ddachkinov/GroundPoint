// @ts-nocheck
import { Request, Response } from 'express';
import { subscriptionService } from '../services/subscription.service';
import { paymentService } from '../services/payment.service';
import { payoutService } from '../services/payout.service';
import { SubscriptionTier } from '@prisma/client';
import Stripe from 'stripe';
import { stripeClient } from '../config/stripe.config';

export class SubscriptionController {
  /**
   * GET /api/v1/subscriptions/current
   * Get current subscription for the user's organization
   */
  async getCurrentSubscription(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const subscription = await subscriptionService.getCurrentSubscription(operatorOrgId);

      res.json(subscription);
    } catch (error: any) {
      console.error('Error getting current subscription:', error);
      res.status(500).json({ error: 'Failed to get subscription' });
    }
  }

  /**
   * POST /api/v1/subscriptions/checkout
   * Create Stripe Checkout session for subscription upgrade
   */
  async createCheckoutSession(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const { tier, billingPeriod } = req.body;

      // Validate input
      if (!tier || !billingPeriod) {
        res.status(400).json({ error: 'Missing required fields: tier, billingPeriod' });
        return;
      }

      if (!['PROFESSIONAL', 'BUSINESS'].includes(tier)) {
        res.status(400).json({ error: 'Invalid tier. Must be PROFESSIONAL or BUSINESS' });
        return;
      }

      if (!['monthly', 'yearly'].includes(billingPeriod)) {
        res.status(400).json({ error: 'Invalid billingPeriod. Must be monthly or yearly' });
        return;
      }

      // Get base URL for redirects
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const successUrl = `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/subscription`;

      const session = await subscriptionService.createCheckoutSession(
        operatorOrgId,
        tier as SubscriptionTier,
        billingPeriod,
        successUrl,
        cancelUrl
      );

      res.json(session);
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: error.message || 'Failed to create checkout session' });
    }
  }

  /**
   * POST /api/v1/subscriptions/portal
   * Create Stripe Customer Portal session
   */
  async createPortalSession(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const returnUrl = `${baseUrl}/subscription`;

      const session = await subscriptionService.createPortalSession(operatorOrgId, returnUrl);

      res.json(session);
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      res.status(500).json({ error: error.message || 'Failed to create portal session' });
    }
  }

  /**
   * GET /api/v1/subscriptions/usage
   * Get usage statistics for the user's organization
   */
  async getUsageStats(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const stats = await subscriptionService.getUsageStats(operatorOrgId);

      res.json(stats);
    } catch (error: any) {
      console.error('Error getting usage stats:', error);
      res.status(500).json({ error: 'Failed to get usage statistics' });
    }
  }

  /**
   * POST /api/v1/subscriptions/cancel
   * Cancel subscription at period end
   */
  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      await subscriptionService.cancelSubscription(operatorOrgId);

      res.json({ message: 'Subscription will be cancelled at the end of the billing period' });
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
    }
  }

  /**
   * POST /api/v1/subscriptions/reactivate
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      await subscriptionService.reactivateSubscription(operatorOrgId);

      res.json({ message: 'Subscription reactivated successfully' });
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      res.status(500).json({ error: error.message || 'Failed to reactivate subscription' });
    }
  }

  /**
   * POST /api/v1/webhooks/stripe
   * Handle Stripe webhook events
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'];

      if (!signature) {
        res.status(400).json({ error: 'Missing stripe-signature header' });
        return;
      }

      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured');
        res.status(500).json({ error: 'Webhook not configured' });
        return;
      }

      // Verify webhook signature
      let event: Stripe.Event;
      try {
        event = stripeClient.webhooks.constructEvent(
          req.body,
          signature,
          webhookSecret
        );
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).json({ error: 'Invalid signature' });
        return;
      }

      // Handle the event based on type
      if (event.type.startsWith('customer.subscription') || event.type.startsWith('checkout.session')) {
        // Subscription-related events
        await subscriptionService.handleWebhookEvent(event);
      } else if (event.type.startsWith('payment_intent') || event.type.startsWith('charge')) {
        // Payment-related events
        switch (event.type) {
          case 'payment_intent.succeeded':
            await paymentService.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
            break;
          case 'payment_intent.payment_failed':
            await paymentService.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
            break;
          case 'charge.refunded':
            await paymentService.handleChargeRefunded(event.data.object as Stripe.Charge);
            break;
          default:
            console.log(`Unhandled payment event type: ${event.type}`);
        }
      } else if (event.type.startsWith('transfer')) {
        // Payout/transfer-related events
        switch (event.type) {
          case 'transfer.paid':
            await payoutService.handleTransferPaid(event.data.object as Stripe.Transfer);
            break;
          case 'transfer.failed':
            await payoutService.handleTransferFailed(event.data.object as Stripe.Transfer);
            break;
          default:
            console.log(`Unhandled transfer event type: ${event.type}`);
        }
      } else {
        console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }

  /**
   * GET /api/v1/subscriptions/check-quota/:type
   * Check if organization has exceeded a specific quota
   */
  async checkQuota(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const { type } = req.params;

      if (!['storage', 'uploadsPerMonth', 'projects'].includes(type)) {
        res.status(400).json({ error: 'Invalid quota type' });
        return;
      }

      const result = await subscriptionService.checkQuota(
        operatorOrgId,
        type as 'storage' | 'uploadsPerMonth' | 'projects'
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error checking quota:', error);
      res.status(500).json({ error: 'Failed to check quota' });
    }
  }
}

export const subscriptionController = new SubscriptionController();
