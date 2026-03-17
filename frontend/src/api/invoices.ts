import { apiClient } from './client';

export interface LineItem {
  line_item_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount?: number;
  sort_order?: number;
}

export interface Invoice {
  invoice_id: string;
  invoice_number: string;
  operator_org_id: string;
  operator_org_name: string;
  site_owner_org_id: string;
  site_owner_org_name: string;
  project_id?: string;
  project_name?: string;
  status: 'DRAFT' | 'SENT' | 'VIEWED' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  payment_terms?: string;
  line_items: LineItem[];
  created_at: string;
  paid_at?: string | null;
}

export interface InvoiceListItem {
  invoice_id: string;
  invoice_number: string;
  site_owner_org_name?: string;
  operator_org_name?: string;
  project_name?: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  currency: string;
  status: string;
}

export interface CreateInvoiceData {
  site_owner_org_id: string;
  project_id?: string;
  issue_date: string;
  due_date: string;
  currency: string;
  notes?: string;
  payment_terms?: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
  }>;
}

export interface InvoiceFilters {
  status?: string;
  project_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface DashboardMetrics {
  total_outstanding: number;
  total_paid_this_month: number;
  avg_time_to_payment_days: number;
  overdue_count: number;
}

export const invoicesAPI = {
  /**
   * Create a new draft invoice
   */
  create: async (data: CreateInvoiceData): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>('/invoices', data);
    return response.data;
  },

  /**
   * List invoices with filters
   */
  list: async (
    filters?: InvoiceFilters
  ): Promise<{ invoices: InvoiceListItem[]; total: number; limit: number; offset: number }> => {
    const response = await apiClient.get<{
      invoices: InvoiceListItem[];
      total: number;
      limit: number;
      offset: number;
    }>('/invoices', { params: filters });
    return response.data;
  },

  /**
   * Get single invoice details
   */
  get: async (invoiceId: string): Promise<Invoice> => {
    const response = await apiClient.get<Invoice>(`/invoices/${invoiceId}`);
    return response.data;
  },

  /**
   * Update an existing draft invoice
   */
  update: async (invoiceId: string, data: Partial<CreateInvoiceData>): Promise<Invoice> => {
    const response = await apiClient.patch<Invoice>(`/invoices/${invoiceId}`, data);
    return response.data;
  },

  /**
   * Send invoice to client
   */
  send: async (invoiceId: string): Promise<{ invoice_id: string; status: string; sent_at: string }> => {
    const response = await apiClient.post<{ invoice_id: string; status: string; sent_at: string }>(
      `/invoices/${invoiceId}/send`
    );
    return response.data;
  },

  /**
   * Cancel an invoice
   */
  cancel: async (
    invoiceId: string,
    reason?: string
  ): Promise<{ invoice_id: string; status: string }> => {
    const response = await apiClient.post<{ invoice_id: string; status: string }>(
      `/invoices/${invoiceId}/cancel`,
      { reason }
    );
    return response.data;
  },

  /**
   * Delete a draft invoice
   */
  delete: async (invoiceId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/invoices/${invoiceId}`);
    return response.data;
  },

  /**
   * Get dashboard metrics
   */
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const response = await apiClient.get<DashboardMetrics>('/invoices/dashboard');
    return response.data;
  },

  /**
   * Create payment intent for invoice
   */
  createPaymentIntent: async (invoiceId: string): Promise<{ client_secret: string; payment_intent_id: string; amount: number; currency: string }> => {
    const response = await apiClient.post<{ client_secret: string; payment_intent_id: string; amount: number; currency: string }>(
      `/invoices/${invoiceId}/payment-intent`
    );
    return response.data;
  },

  /**
   * Download invoice PDF
   */
  downloadPDF: async (invoiceId: string): Promise<Blob> => {
    const response = await apiClient.get(`/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
