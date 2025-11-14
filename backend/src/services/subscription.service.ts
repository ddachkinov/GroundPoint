import { PrismaClient, SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { stripeClient, TIER_PRICES, TIER_QUOTAS } from '../config/stripe.config';
import Stripe from 'stripe';

const prisma = new PrismaClient();

export class SubscriptionService {
  /**
   * Get current subscription for an organization
   */
  async getCurrentSubscription(organizationId: string) {
    const subscription = await prisma.operatorSubscription.findUnique({
      where: { organizationId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!subscription) {
      // Return default FREE tier if no subscription exists
      return {
        organizationId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        cancelAtPeriodEnd: false,
        quotas: TIER_QUOTAS.FREE,
      };
    }

    return {
      ...subscription,
      quotas: TIER_QUOTAS[subscription.tier],
    };
  }

  /**
   * Create Stripe Checkout session for subscription upgrade/creation
   */
  async createCheckoutSession(
    organizationId: string,
    tier: SubscriptionTier,
    billingPeriod: 'monthly' | 'yearly',
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    // Validate tier
    if (tier === SubscriptionTier.FREE || tier === SubscriptionTier.ENTERPRISE) {
      throw new Error('Cannot create checkout session for FREE or ENTERPRISE tiers');
    }

    // Get organization and current subscription
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        subscription: true,
      },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Determine price ID
    let priceId: string;
    if (tier === SubscriptionTier.PROFESSIONAL) {
      priceId = billingPeriod === 'monthly'
        ? TIER_PRICES.PROFESSIONAL_MONTHLY
        : TIER_PRICES.PROFESSIONAL_YEARLY;
    } else if (tier === SubscriptionTier.BUSINESS) {
      priceId = billingPeriod === 'monthly'
        ? TIER_PRICES.BUSINESS_MONTHLY
        : TIER_PRICES.BUSINESS_YEARLY;
    } else {
      throw new Error('Invalid tier for checkout');
    }

    if (!priceId) {
      throw new Error('Price ID not configured for this tier');
    }

    // Create or get Stripe customer
    let customerId: string | undefined;
    if (organization.subscription?.stripeSubscriptionId) {
      // Get existing customer from subscription
      const existingSubscription = await stripeClient.subscriptions.retrieve(
        organization.subscription.stripeSubscriptionId
      );
      customerId = existingSubscription.customer as string;
    }

    // Create checkout session
    const session = await stripeClient.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : organization.name, // Use org name as fallback
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organizationId,
        tier,
        billingPeriod,
      },
      subscription_data: {
        metadata: {
          organizationId,
          tier,
        },
      },
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session');
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Create Stripe Customer Portal session for subscription management
   */
  async createPortalSession(
    organizationId: string,
    returnUrl: string
  ): Promise<{ url: string }> {
    const subscription = await prisma.operatorSubscription.findUnique({
      where: { organizationId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    // Get customer ID from subscription
    const stripeSubscription = await stripeClient.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    const session = await stripeClient.billingPortal.sessions.create({
      customer: stripeSubscription.customer as string,
      return_url: returnUrl,
    });

    return {
      url: session.url,
    };
  }

  /**
   * Handle Stripe webhook events for subscription lifecycle
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle checkout session completed
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const organizationId = session.metadata?.organizationId;
    const tier = session.metadata?.tier as SubscriptionTier;

    if (!organizationId || !tier) {
      console.error('Missing metadata in checkout session', session.id);
      return;
    }

    // Subscription will be handled by subscription.created event
    console.log(`Checkout completed for organization ${organizationId}, tier ${tier}`);
  }

  /**
   * Handle subscription created/updated
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const organizationId = subscription.metadata?.organizationId;
    const tier = subscription.metadata?.tier as SubscriptionTier;

    if (!organizationId || !tier) {
      console.error('Missing metadata in subscription', subscription.id);
      return;
    }

    // Map Stripe status to our status
    let status: SubscriptionStatus;
    switch (subscription.status) {
      case 'active':
        status = SubscriptionStatus.ACTIVE;
        break;
      case 'past_due':
        status = SubscriptionStatus.PAST_DUE;
        break;
      case 'canceled':
        status = SubscriptionStatus.CANCELLED;
        break;
      case 'trialing':
        status = SubscriptionStatus.TRIALING;
        break;
      default:
        status = SubscriptionStatus.ACTIVE;
    }

    // Upsert subscription
    await prisma.operatorSubscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        tier,
        status,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        tier,
        status,
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    console.log(`Subscription updated for organization ${organizationId}: ${status}`);
  }

  /**
   * Handle subscription deleted
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const organizationId = subscription.metadata?.organizationId;

    if (!organizationId) {
      console.error('Missing organizationId in subscription metadata', subscription.id);
      return;
    }

    // Downgrade to FREE tier
    await prisma.operatorSubscription.upsert({
      where: { organizationId },
      create: {
        organizationId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.CANCELLED,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      },
      update: {
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.CANCELLED,
        stripeSubscriptionId: null,
        cancelAtPeriodEnd: false,
      },
    });

    console.log(`Subscription cancelled for organization ${organizationId}, downgraded to FREE`);
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) return;

    const subscription = await stripeClient.subscriptions.retrieve(
      invoice.subscription as string
    );

    // Update subscription status to ACTIVE if it was PAST_DUE
    const organizationId = subscription.metadata?.organizationId;
    if (organizationId) {
      await prisma.operatorSubscription.updateMany({
        where: {
          organizationId,
          status: SubscriptionStatus.PAST_DUE,
        },
        data: {
          status: SubscriptionStatus.ACTIVE,
        },
      });

      console.log(`Payment succeeded for organization ${organizationId}`);
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) return;

    const subscription = await stripeClient.subscriptions.retrieve(
      invoice.subscription as string
    );

    // Update subscription status to PAST_DUE
    const organizationId = subscription.metadata?.organizationId;
    if (organizationId) {
      await prisma.operatorSubscription.updateMany({
        where: {
          organizationId,
        },
        data: {
          status: SubscriptionStatus.PAST_DUE,
        },
      });

      console.log(`Payment failed for organization ${organizationId}`);
    }
  }

  /**
   * Check if organization has exceeded quota
   */
  async checkQuota(
    organizationId: string,
    quotaType: 'storage' | 'uploadsPerMonth' | 'projects'
  ): Promise<{ allowed: boolean; current: number; limit: number }> {
    const subscription = await this.getCurrentSubscription(organizationId);
    const quotas = subscription.quotas;

    let current = 0;
    let limit = 0;

    switch (quotaType) {
      case 'storage':
        // Calculate total storage used
        const storageResult = await prisma.$queryRaw<Array<{ total: bigint }>>`
          SELECT COALESCE(SUM(file_size), 0) as total
          FROM captures c
          JOIN sites s ON c.site_id = s.site_id
          JOIN projects p ON s.project_id = p.project_id
          WHERE p.operator_organization_id = ${organizationId}
        `;
        current = Number(storageResult[0]?.total || 0);
        limit = quotas.storage;
        break;

      case 'uploadsPerMonth':
        // Calculate uploads this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const uploadCount = await prisma.capture.count({
          where: {
            site: {
              project: {
                operatorOrganizationId: organizationId,
              },
            },
            uploadedAt: {
              gte: startOfMonth,
            },
          },
        });
        current = uploadCount;
        limit = quotas.uploadsPerMonth;
        break;

      case 'projects':
        // Calculate project count
        const projectCount = await prisma.project.count({
          where: {
            operatorOrganizationId: organizationId,
          },
        });
        current = projectCount;
        limit = quotas.projects;
        break;
    }

    // -1 means unlimited
    const allowed = limit === -1 || current < limit;

    return { allowed, current, limit };
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(organizationId: string): Promise<void> {
    const subscription = await prisma.operatorSubscription.findUnique({
      where: { organizationId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    // Cancel at period end in Stripe
    await stripeClient.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update local record
    await prisma.operatorSubscription.update({
      where: { organizationId },
      data: {
        cancelAtPeriodEnd: true,
      },
    });
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(organizationId: string): Promise<void> {
    const subscription = await prisma.operatorSubscription.findUnique({
      where: { organizationId },
    });

    if (!subscription?.stripeSubscriptionId) {
      throw new Error('No active subscription found');
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new Error('Subscription is not cancelled');
    }

    // Reactivate in Stripe
    await stripeClient.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    // Update local record
    await prisma.operatorSubscription.update({
      where: { organizationId },
      data: {
        cancelAtPeriodEnd: false,
      },
    });
  }

  /**
   * Get usage statistics for an organization
   */
  async getUsageStats(organizationId: string) {
    const subscription = await this.getCurrentSubscription(organizationId);
    const quotas = subscription.quotas;

    // Get storage usage
    const storageCheck = await this.checkQuota(organizationId, 'storage');

    // Get uploads this month
    const uploadsCheck = await this.checkQuota(organizationId, 'uploadsPerMonth');

    // Get project count
    const projectsCheck = await this.checkQuota(organizationId, 'projects');

    return {
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      usage: {
        storage: {
          used: storageCheck.current,
          limit: storageCheck.limit,
          percentage: storageCheck.limit === -1 ? 0 : (storageCheck.current / storageCheck.limit) * 100,
        },
        uploads: {
          used: uploadsCheck.current,
          limit: uploadsCheck.limit,
          percentage: uploadsCheck.limit === -1 ? 0 : (uploadsCheck.current / uploadsCheck.limit) * 100,
        },
        projects: {
          used: projectsCheck.current,
          limit: projectsCheck.limit,
          percentage: projectsCheck.limit === -1 ? 0 : (projectsCheck.current / projectsCheck.limit) * 100,
        },
      },
    };
  }
}

export const subscriptionService = new SubscriptionService();
