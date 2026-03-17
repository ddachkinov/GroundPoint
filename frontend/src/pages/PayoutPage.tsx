// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { payoutsAPI, PayoutDashboard, ConnectAccountStatus, Payout } from '../api/payouts';

const formatCurrency = (amount: number, currency: string = 'USD'): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

const PAYOUT_STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  PROCESSING: '#3b82f6',
  COMPLETED: '#10b981',
  FAILED: '#ef4444',
};

export function PayoutPage() {
  const [dashboard, setDashboard] = useState<PayoutDashboard | null>(null);
  const [connectStatus, setConnectStatus] = useState<ConnectAccountStatus | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limit = 20;

  useEffect(() => {
    loadAll();
  }, [offset]);

  const loadAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dash, status, payoutList] = await Promise.all([
        payoutsAPI.getDashboard(),
        payoutsAPI.getConnectAccountStatus(),
        payoutsAPI.list({ limit, offset }),
      ]);
      setDashboard(dash);
      setConnectStatus(status);
      setPayouts(payoutList.payouts);
      setTotal(payoutList.total);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load payout data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const result = await payoutsAPI.createConnectAccount();
      if (result.onboarding_url) {
        window.location.href = result.onboarding_url;
      } else {
        setConnectStatus(result);
      }
    } catch {
      setError('Failed to start Stripe Connect onboarding. Check your Stripe configuration.');
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return <div className="page-loading">Loading payout dashboard…</div>;
  }

  const currency = dashboard?.currency || 'USD';
  const hasPrevious = offset > 0;
  const hasMore = offset + limit < total;

  return (
    <div className="payout-page">
      <div className="page-header">
        <h1>Payouts</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      {/* Stripe Connect setup */}
      {connectStatus && !connectStatus.payouts_enabled && (
        <div className="connect-banner">
          <div className="connect-banner-content">
            <div>
              <h2 className="connect-title">Set up payouts</h2>
              <p className="connect-desc">
                Connect your Stripe account to receive payments directly to your bank account.
                {connectStatus.connected && !connectStatus.details_submitted
                  ? ' Your account is connected but setup is incomplete.'
                  : ''}
              </p>
            </div>
            <button
              onClick={handleConnectStripe}
              disabled={isConnecting}
              className="connect-button"
            >
              {isConnecting
                ? 'Redirecting…'
                : connectStatus.connected
                ? 'Complete Setup'
                : 'Connect with Stripe'}
            </button>
          </div>
        </div>
      )}

      {connectStatus?.payouts_enabled && (
        <div className="connect-badge">
          <span className="connect-dot" /> Stripe account connected — payouts enabled
        </div>
      )}

      {/* Earnings summary cards */}
      {dashboard && (
        <div className="metrics-panel">
          <div className="metric-card">
            <div className="metric-label">Total Earned</div>
            <div className="metric-value">{formatCurrency(dashboard.total_earned, currency)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Pending</div>
            <div className="metric-value pending">
              {formatCurrency(dashboard.total_pending, currency)}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Paid Out</div>
            <div className="metric-value success">
              {formatCurrency(dashboard.total_paid, currency)}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Platform Fees</div>
            <div className="metric-value neutral">
              {formatCurrency(dashboard.platform_fees_paid, currency)}
            </div>
          </div>
        </div>
      )}

      {/* Payouts table */}
      <div className="section-title">Payout History</div>

      {payouts.length === 0 ? (
        <div className="empty-state">
          <p>No payouts yet. Payouts are triggered automatically when invoices are paid.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="payouts-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Gross Amount</th>
                  <th>Platform Fee</th>
                  <th>Net Payout</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.payout_id}>
                    <td>{payout.invoice_number || payout.invoice_id.slice(0, 8)}</td>
                    <td>{formatCurrency(payout.amount, payout.currency)}</td>
                    <td className="fee-cell">{formatCurrency(payout.platform_fee, payout.currency)}</td>
                    <td className="net-cell">{formatCurrency(payout.net_amount, payout.currency)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ background: PAYOUT_STATUS_COLORS[payout.status] || '#9ca3af' }}
                      >
                        {payout.status}
                      </span>
                    </td>
                    <td>{new Date(payout.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={!hasPrevious}
              className="page-button"
            >
              Previous
            </button>
            <span className="page-info">
              {offset + 1}–{Math.min(offset + limit, total)} of {total}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={!hasMore}
              className="page-button"
            >
              Next
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .payout-page {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .page-loading {
          text-align: center;
          padding: 80px 20px;
          color: #6b7280;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .page-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
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
        .alert-close { background: none; border: none; cursor: pointer; font-size: 18px; color: inherit; }
        .connect-banner {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          color: white;
        }
        .connect-banner-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .connect-title { font-size: 20px; font-weight: 700; margin: 0 0 6px; }
        .connect-desc { font-size: 14px; opacity: 0.9; margin: 0; max-width: 500px; }
        .connect-button {
          background: white;
          color: #1e40af;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        .connect-button:disabled { opacity: 0.6; cursor: not-allowed; }
        .connect-button:hover:not(:disabled) { background: #f0f9ff; }
        .connect-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #d1fae5;
          border-radius: 8px;
          color: #065f46;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 24px;
        }
        .connect-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          display: inline-block;
        }
        .metrics-panel {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }
        .metric-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .metric-label {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;
          font-weight: 500;
        }
        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
        }
        .metric-value.success { color: #10b981; }
        .metric-value.pending { color: #f59e0b; }
        .metric-value.neutral { color: #6b7280; }
        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
          color: #6b7280;
          font-size: 15px;
        }
        .table-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .payouts-table { width: 100%; border-collapse: collapse; }
        .payouts-table th {
          background: #f9fafb;
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .payouts-table td {
          padding: 14px 16px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #111827;
        }
        .fee-cell { color: #6b7280; }
        .net-cell { font-weight: 700; color: #10b981; }
        .status-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          color: white;
        }
        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding: 16px;
          background: white;
          border-radius: 12px;
        }
        .page-button {
          padding: 8px 16px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .page-button:hover:not(:disabled) { background: #e5e7eb; }
        .page-button:disabled { opacity: 0.5; cursor: not-allowed; }
        .page-info { font-size: 14px; color: #6b7280; }
      `}</style>
    </div>
  );
}
