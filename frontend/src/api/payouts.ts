import { apiClient } from './client';

export interface PayoutDashboard {
  total_earned: number;
  total_pending: number;
  total_paid: number;
  platform_fees_paid: number;
  payout_count: number;
  currency: string;
}

export interface ConnectAccountStatus {
  connected: boolean;
  account_id?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
  onboarding_url?: string;
}

export interface Payout {
  payout_id: string;
  invoice_id: string;
  invoice_number?: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  created_at: string;
  processed_at?: string | null;
}

export const payoutsAPI = {
  getDashboard: async (): Promise<PayoutDashboard> => {
    const response = await apiClient.get<PayoutDashboard>('/payouts/dashboard');
    return response.data;
  },

  list: async (filters?: { status?: string; limit?: number; offset?: number }): Promise<{ payouts: Payout[]; total: number }> => {
    const response = await apiClient.get<{ payouts: Payout[]; total: number }>('/payouts', { params: filters });
    return response.data;
  },

  getConnectAccountStatus: async (): Promise<ConnectAccountStatus> => {
    const response = await apiClient.get<ConnectAccountStatus>('/payouts/operators/connect-account/status');
    return response.data;
  },

  createConnectAccount: async (): Promise<ConnectAccountStatus> => {
    const response = await apiClient.post<ConnectAccountStatus>('/payouts/operators/connect-account');
    return response.data;
  },
};
