import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { invoicesAPI, Invoice } from '../api/invoices';
import apiClient from '../api/client';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

function PaymentForm({ invoice }: { invoice: Invoice }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const response = await apiClient.post<{ clientSecret: string }>(
        `/invoices/${invoice.invoice_id}/payment-intent`
      );

      const { clientSecret } = response.data;

      // Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
        setProcessing(false);
      } else {
        setSucceeded(true);
        setProcessing(false);
        setTimeout(() => {
          navigate('/client/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#ef4444',
      },
    },
  };

  if (succeeded) {
    return (
      <div className="success-message">
        <div className="success-icon">✓</div>
        <h3>Payment Successful!</h3>
        <p>Your payment of ${invoice.total_amount.toFixed(2)} has been processed.</p>
        <p>Redirecting to dashboard...</p>
        <style jsx>{`
          .success-message {
            text-align: center;
            padding: 40px;
            background: #f0fdf4;
            border-radius: 12px;
            border: 2px solid #10b981;
          }

          .success-icon {
            width: 64px;
            height: 64px;
            background: #10b981;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: 700;
            margin: 0 auto 16px;
          }

          h3 {
            font-size: 24px;
            font-weight: 700;
            color: #047857;
            margin-bottom: 8px;
          }

          p {
            color: #065f46;
            margin: 4px 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="form-section">
        <label className="form-label">Card Details</label>
        <div className="card-element">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="submit-button"
      >
        {processing ? 'Processing...' : `Pay $${invoice.total_amount.toFixed(2)}`}
      </button>

      <p className="secure-note">
        <span className="lock-icon">🔒</span>
        Your payment is secure and encrypted
      </p>

      <style jsx>{`
        .payment-form {
          max-width: 500px;
        }

        .form-section {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .card-element {
          padding: 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .error-icon {
          font-size: 18px;
        }

        .submit-button {
          width: 100%;
          padding: 16px;
          background: #667eea;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-button:hover:not(:disabled) {
          background: #5568d3;
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .secure-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
          font-size: 13px;
          color: #6b7280;
        }

        .lock-icon {
          font-size: 14px;
        }
      `}</style>
    </form>
  );
}

export function ClientInvoicePaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await invoicesAPI.get(id);
      setInvoice(data);

      // Check if already paid
      if (data.status === 'PAID') {
        setError('This invoice has already been paid.');
      } else if (data.status === 'CANCELLED') {
        setError('This invoice has been cancelled.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!id) return;

    try {
      const blob = await invoicesAPI.downloadPDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice?.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading invoice...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f9fafb;
          }

          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #e5e7eb;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>Error</h2>
        <p>{error || 'Invoice not found'}</p>
        <button onClick={() => navigate('/client/dashboard')} className="back-button">
          Back to Dashboard
        </button>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f9fafb;
            padding: 24px;
          }

          .error-icon {
            font-size: 64px;
            margin-bottom: 16px;
          }

          h2 {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 8px;
          }

          p {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 24px;
          }

          .back-button {
            padding: 12px 24px;
            background: #667eea;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            color: white;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <button onClick={() => navigate('/client/dashboard')} className="back-link">
          ← Back to Dashboard
        </button>

        <div className="payment-content">
          {/* Invoice Details */}
          <div className="invoice-details">
            <div className="invoice-header">
              <h1 className="invoice-title">Invoice {invoice.invoice_number}</h1>
              <button onClick={downloadPDF} className="download-button">
                📄 Download PDF
              </button>
            </div>

            <div className="invoice-meta">
              <div className="meta-item">
                <span className="meta-label">From:</span>
                <span className="meta-value">{invoice.operator_org_name}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Project:</span>
                <span className="meta-value">{invoice.project_name || 'General'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Issue Date:</span>
                <span className="meta-value">
                  {new Date(invoice.issue_date).toLocaleDateString()}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Due Date:</span>
                <span className="meta-value">
                  {new Date(invoice.due_date).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="line-items">
              <h3 className="section-title">Items</h3>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.line_items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description}</td>
                      <td>{item.quantity}</td>
                      <td>${item.unit_price.toFixed(2)}</td>
                      <td>${(item.quantity * item.unit_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.tax_rate > 0 && (
                  <div className="total-row">
                    <span>Tax ({(invoice.tax_rate * 100).toFixed(2)}%):</span>
                    <span>${invoice.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="total-row final">
                  <span>Total:</span>
                  <span>${invoice.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="notes">
                <h3 className="section-title">Notes</h3>
                <p>{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Payment Form */}
          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <div className="payment-section">
              <h2 className="payment-title">Pay Invoice</h2>
              <Elements stripe={stripePromise}>
                <PaymentForm invoice={invoice} />
              </Elements>
            </div>
          )}

          {invoice.status === 'PAID' && (
            <div className="paid-notice">
              <div className="paid-icon">✓</div>
              <h3>Invoice Paid</h3>
              <p>
                This invoice was paid on{' '}
                {invoice.paid_at && new Date(invoice.paid_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .payment-page {
          min-height: 100vh;
          background: #f9fafb;
          padding: 40px 24px;
        }

        .payment-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .back-link {
          display: inline-block;
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          margin-bottom: 24px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }

        .back-link:hover {
          color: #5568d3;
        }

        .payment-content {
          display: grid;
          grid-template-columns: 1fr 500px;
          gap: 32px;
        }

        /* Invoice Details */
        .invoice-details {
          background: white;
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .invoice-title {
          font-size: 28px;
          font-weight: 800;
          color: #111827;
        }

        .download-button {
          padding: 10px 20px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .download-button:hover {
          background: #e5e7eb;
        }

        .invoice-meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
          text-transform: uppercase;
        }

        .meta-value {
          font-size: 16px;
          color: #111827;
          font-weight: 600;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
        }

        .line-items {
          margin-bottom: 32px;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }

        .items-table th {
          text-align: left;
          padding: 12px;
          background: #f9fafb;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
        }

        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
          color: #374151;
        }

        .totals {
          border-top: 2px solid #e5e7eb;
          padding-top: 16px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          font-size: 14px;
          color: #374151;
        }

        .total-row.final {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          border-top: 2px solid #e5e7eb;
          margin-top: 8px;
          padding-top: 16px;
        }

        .notes {
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .notes p {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.6;
          margin: 0;
        }

        /* Payment Section */
        .payment-section {
          background: white;
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          height: fit-content;
          position: sticky;
          top: 24px;
        }

        .payment-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 24px;
        }

        .paid-notice {
          background: #f0fdf4;
          padding: 32px;
          border-radius: 12px;
          border: 2px solid #10b981;
          text-align: center;
        }

        .paid-icon {
          width: 64px;
          height: 64px;
          background: #10b981;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          margin: 0 auto 16px;
        }

        .paid-notice h3 {
          font-size: 24px;
          font-weight: 700;
          color: #047857;
          margin-bottom: 8px;
        }

        .paid-notice p {
          color: #065f46;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .payment-content {
            grid-template-columns: 1fr;
          }

          .payment-section {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .invoice-meta {
            grid-template-columns: 1fr;
          }

          .invoice-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
