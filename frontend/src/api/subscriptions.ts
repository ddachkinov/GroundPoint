import apiClient from './client';

export interface Subscription {
  organizationId: string;
  tier: 'FREE' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIALING';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  quotas: {
    storage: number;
    uploadsPerMonth: number;
    projects: number;
    retentionDays: number;
  };
}

export interface UsageStats {
  tier: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  usage: {
    storage: {
      used: number;
      limit: number;
      percentage: number;
    };
    uploads: {
      used: number;
      limit: number;
      percentage: number;
    };
    projects: {
      used: number;
      limit: number;
      percentage: number;
    };
  };
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface PortalSession {
  url: string;
}

export interface QuotaCheck {
  allowed: boolean;
  current: number;
  limit: number;
}

export const subscriptionsAPI = {
  /**
   * Get current subscription
   */
  getCurrent: async (): Promise<Subscription> => {
    const response = await apiClient.get<Subscription>('/subscriptions/current');
    return response.data;
  },

  /**
   * Create checkout session for subscription upgrade
   */
  createCheckoutSession: async (
    tier: 'PROFESSIONAL' | 'BUSINESS',
    billingPeriod: 'monthly' | 'yearly'
  ): Promise<CheckoutSession> => {
    const response = await apiClient.post<CheckoutSession>('/subscriptions/checkout', {
      tier,
      billingPeriod,
    });
    return response.data;
  },

  /**
   * Create portal session for subscription management
   */
  createPortalSession: async (): Promise<PortalSession> => {
    const response = await apiClient.post<PortalSession>('/subscriptions/portal');
    return response.data;
  },

  /**
   * Get usage statistics
   */
  getUsageStats: async (): Promise<UsageStats> => {
    const response = await apiClient.get<UsageStats>('/subscriptions/usage');
    return response.data;
  },

  /**
   * Cancel subscription at period end
   */
  cancel: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/subscriptions/cancel');
    return response.data;
  },

  /**
   * Reactivate cancelled subscription
   */
  reactivate: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/subscriptions/reactivate');
    return response.data;
  },

  /**
   * Check specific quota
   */
  checkQuota: async (type: 'storage' | 'uploadsPerMonth' | 'projects'): Promise<QuotaCheck> => {
    const response = await apiClient.get<QuotaCheck>(`/subscriptions/check-quota/${type}`);
    return response.data;
  },
};
