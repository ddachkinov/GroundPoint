// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { invoicesAPI, Invoice } from '../api/invoices';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const formatCurrency = (amount: number, currency: string = 'USD'): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#9ca3af',
  SENT: '#3b82f6',
  VIEWED: '#8b5cf6',
  PAID: '#10b981',
  OVERDUE: '#ef4444',
  CANCELLED: '#6b7280',
  REFUNDED: '#f59e0b',
};

// ─── Stripe payment form ────────────────────────────────────────────────────

function PaymentForm({
  invoiceId,
  amount,
  currency,
  onSuccess,
}: {
  invoiceId: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingIntent, setIsLoadingIntent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingIntent(true);
    invoicesAPI
      .createPaymentIntent(invoiceId)
      .then((data) => setClientSecret(data.client_secret))
      .catch(() => setError('Failed to initialise payment. Please try again.'))
      .finally(() => setIsLoadingIntent(false));
  }, [invoiceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setIsProcessing(true);
    setError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement)! },
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed');
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess();
    } else {
      setError('Payment was not completed. Please try again.');
      setIsProcessing(false);
    }
  };

  if (isLoadingIntent) {
    return <div className="payment-loading">Preparing payment…</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <h3 className="payment-title">Pay {formatCurrency(amount, currency)}</h3>
      <div className="card-element-wrapper">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#111827',
                '::placeholder': { color: '#9ca3af' },
              },
            },
          }}
        />
      </div>
      {error && <div className="payment-error">{error}</div>}
      <button type="submit" disabled={!stripe || isProcessing} className="pay-button">
        {isProcessing ? 'Processing…' : `Pay ${formatCurrency(amount, currency)}`}
      </button>
    </form>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadInvoice = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await invoicesAPI.get(id);
      setInvoice(data);
    } catch {
      setActionError('Failed to load invoice.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const handleSend = async () => {
    if (!invoice) return;
    setIsSending(true);
    setActionError(null);
    try {
      await invoicesAPI.send(invoice.invoice_id);
      setActionSuccess('Invoice sent to client.');
      await loadInvoice();
    } catch {
      setActionError('Failed to send invoice.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = async () => {
    if (!invoice || !window.confirm('Cancel this invoice? This cannot be undone.')) return;
    setIsCancelling(true);
    setActionError(null);
    try {
      await invoicesAPI.cancel(invoice.invoice_id, 'Cancelled by operator');
      setActionSuccess('Invoice cancelled.');
      await loadInvoice();
    } catch {
      setActionError('Failed to cancel invoice.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      const blob = await invoicesAPI.downloadPDF(invoice.invoice_id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setActionError('PDF not available. Make sure Chromium is installed on the server.');
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setActionSuccess('Payment successful! Invoice is now marked as paid.');
    await loadInvoice();
  };

  if (isLoading) {
    return <div className="page-loading">Loading invoice…</div>;
  }

  if (!invoice) {
    return (
      <div className="page-error">
        <p>Invoice not found.</p>
        <button onClick={() => navigate('/invoices')} className="back-button">
          Back to Invoices
        </button>
      </div>
    );
  }

  const canSend = invoice.status === 'DRAFT';
  const canCancel = ['DRAFT', 'SENT', 'VIEWED', 'OVERDUE'].includes(invoice.status);
  const canPay = ['SENT', 'VIEWED', 'OVERDUE'].includes(invoice.status);

  return (
    <div className="invoice-detail-page">
      {/* Header */}
      <div className="page-header">
        <button onClick={() => navigate('/invoices')} className="back-button">
          ← Back to Invoices
        </button>
        <div className="header-actions">
          <button onClick={handleDownloadPDF} className="btn btn-secondary">
            Download PDF
          </button>
          {canSend && (
            <button onClick={handleSend} disabled={isSending} className="btn btn-primary">
              {isSending ? 'Sending…' : 'Send to Client'}
            </button>
          )}
          {canPay && !showPayment && (
            <button onClick={() => setShowPayment(true)} className="btn btn-success">
              Pay Invoice
            </button>
          )}
          {canCancel && (
            <button onClick={handleCancel} disabled={isCancelling} className="btn btn-danger">
              {isCancelling ? 'Cancelling…' : 'Cancel Invoice'}
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="alert alert-error">
          {actionError}
          <button onClick={() => setActionError(null)} className="alert-close">×</button>
        </div>
      )}
      {actionSuccess && (
        <div className="alert alert-success">
          {actionSuccess}
          <button onClick={() => setActionSuccess(null)} className="alert-close">×</button>
        </div>
      )}

      {/* Payment form */}
      {showPayment && canPay && (
        <div className="payment-section">
          <Elements stripe={stripePromise}>
            <PaymentForm
              invoiceId={invoice.invoice_id}
              amount={invoice.total_amount}
              currency={invoice.currency}
              onSuccess={handlePaymentSuccess}
            />
          </Elements>
          <button onClick={() => setShowPayment(false)} className="btn btn-secondary" style={{ marginTop: 12 }}>
            Cancel Payment
          </button>
        </div>
      )}

      {/* Invoice card */}
      <div className="invoice-card">
        <div className="invoice-card-header">
          <div>
            <h1 className="invoice-number">{invoice.invoice_number}</h1>
            <p className="org-names">
              {invoice.operator_org_name} → {invoice.site_owner_org_name}
            </p>
            {invoice.project_name && (
              <p className="project-name">Project: {invoice.project_name}</p>
            )}
          </div>
          <span
            className="status-badge"
            style={{ background: STATUS_COLORS[invoice.status] || '#9ca3af' }}
          >
            {invoice.status}
          </span>
        </div>

        <div className="invoice-meta">
          <div className="meta-row">
            <span className="meta-label">Issue Date</span>
            <span>{new Date(invoice.issue_date).toLocaleDateString()}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Due Date</span>
            <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
          </div>
          {invoice.payment_terms && (
            <div className="meta-row">
              <span className="meta-label">Payment Terms</span>
              <span>{invoice.payment_terms}</span>
            </div>
          )}
          {invoice.paid_at && (
            <div className="meta-row">
              <span className="meta-label">Paid At</span>
              <span>{new Date(invoice.paid_at).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Line items */}
        <table className="line-items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Unit Price</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.line_items.map((item, i) => (
              <tr key={item.line_item_id || i}>
                <td>{item.description}</td>
                <td className="text-right">{item.quantity}</td>
                <td className="text-right">{formatCurrency(item.unit_price, invoice.currency)}</td>
                <td className="text-right">
                  {formatCurrency(item.amount ?? item.quantity * item.unit_price, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="totals-section">
          <div className="total-row">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="total-row">
            <span>Tax ({invoice.tax_rate}%)</span>
            <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
          </div>
          <div className="total-row total-final">
            <span>Total</span>
            <span>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="notes-section">
            <p className="notes-label">Notes</p>
            <p className="notes-text">{invoice.notes}</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .invoice-detail-page {
          padding: 24px;
          max-width: 860px;
          margin: 0 auto;
        }
        .page-loading,
        .page-error {
          text-align: center;
          padding: 80px 20px;
          color: #6b7280;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .back-button {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 14px;
          cursor: pointer;
          padding: 0;
          font-weight: 600;
        }
        .back-button:hover { text-decoration: underline; }
        .header-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary { background: #3b82f6; color: white; }
        .btn-primary:hover:not(:disabled) { background: #2563eb; }
        .btn-secondary { background: #f3f4f6; color: #111827; border: 1px solid #d1d5db; }
        .btn-secondary:hover { background: #e5e7eb; }
        .btn-success { background: #10b981; color: white; }
        .btn-success:hover { background: #059669; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover:not(:disabled) { background: #dc2626; }
        .alert {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .alert-error { background: #fee2e2; color: #991b1b; }
        .alert-success { background: #d1fae5; color: #065f46; }
        .alert-close { background: none; border: none; cursor: pointer; font-size: 18px; color: inherit; }
        .payment-section {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-bottom: 24px;
        }
        .payment-loading { color: #6b7280; padding: 16px 0; }
        .payment-form { display: flex; flex-direction: column; gap: 16px; }
        .payment-title { font-size: 18px; font-weight: 700; color: #111827; margin: 0; }
        .card-element-wrapper {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 14px 16px;
          background: white;
        }
        .payment-error { color: #dc2626; font-size: 14px; }
        .pay-button {
          background: #10b981;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
        }
        .pay-button:disabled { opacity: 0.6; cursor: not-allowed; }
        .pay-button:hover:not(:disabled) { background: #059669; }
        .invoice-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 32px;
        }
        .invoice-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .invoice-number { font-size: 28px; font-weight: 700; color: #111827; margin: 0 0 4px; }
        .org-names { color: #374151; font-size: 15px; margin: 0 0 4px; }
        .project-name { color: #6b7280; font-size: 13px; margin: 0; }
        .status-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          color: white;
          white-space: nowrap;
        }
        .invoice-meta {
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          padding: 16px 0;
          margin-bottom: 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        .meta-row { display: flex; flex-direction: column; gap: 2px; }
        .meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #9ca3af; font-weight: 600; }
        .line-items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .line-items-table th {
          background: #f9fafb;
          padding: 10px 12px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
          font-weight: 600;
          text-align: left;
        }
        .line-items-table td {
          padding: 12px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #111827;
        }
        .text-right { text-align: right; }
        .totals-section {
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
          max-width: 320px;
          margin-left: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #374151;
        }
        .total-final {
          border-top: 2px solid #111827;
          padding-top: 8px;
          margin-top: 4px;
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }
        .notes-section { margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
        .notes-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin: 0 0 6px; }
        .notes-text { font-size: 14px; color: #374151; margin: 0; line-height: 1.5; }
      `}</style>
    </div>
  );
}
