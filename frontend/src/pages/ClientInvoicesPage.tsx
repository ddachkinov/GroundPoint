import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoicesAPI, InvoiceListItem } from '../api/invoices';

export function ClientInvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadInvoices();
  }, [filter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const data = await invoicesAPI.list(params);
      setInvoices(data.invoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return '#10b981';
      case 'OVERDUE':
        return '#ef4444';
      case 'SENT':
      case 'VIEWED':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const downloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const blob = await invoicesAPI.downloadPDF(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading PDF:', err);
    }
  };

  return (
    <div className="invoices-page">
      <div className="invoices-container">
        <button onClick={() => navigate('/client/dashboard')} className="back-link">
          ← Back to Dashboard
        </button>

        <div className="page-header">
          <h1 className="page-title">My Invoices</h1>
        </div>

        {/* Filters */}
        <div className="filters">
          <button
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-button ${filter === 'SENT' ? 'active' : ''}`}
            onClick={() => setFilter('SENT')}
          >
            Pending
          </button>
          <button
            className={`filter-button ${filter === 'PAID' ? 'active' : ''}`}
            onClick={() => setFilter('PAID')}
          >
            Paid
          </button>
          <button
            className={`filter-button ${filter === 'OVERDUE' ? 'active' : ''}`}
            onClick={() => setFilter('OVERDUE')}
          >
            Overdue
          </button>
        </div>

        {/* Invoices List */}
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading invoices...</p>
          </div>
        ) : invoices.length > 0 ? (
          <div className="invoices-grid">
            {invoices.map((invoice) => (
              <div key={invoice.invoice_id} className="invoice-card">
                <div className="invoice-header">
                  <div>
                    <div className="invoice-number">{invoice.invoice_number}</div>
                    <div className="invoice-from">From: {invoice.operator_org_name}</div>
                  </div>
                  <div
                    className="invoice-status"
                    style={{ background: getStatusColor(invoice.status) }}
                  >
                    {invoice.status}
                  </div>
                </div>

                <div className="invoice-details">
                  {invoice.project_name && (
                    <div className="detail-row">
                      <span className="detail-label">Project:</span>
                      <span className="detail-value">{invoice.project_name}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value amount">
                      {invoice.currency} ${invoice.total_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Issue Date:</span>
                    <span className="detail-value">
                      {new Date(invoice.issue_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Due Date:</span>
                    <span className="detail-value">
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="invoice-actions">
                  <button
                    onClick={() => navigate(`/client/invoices/${invoice.invoice_id}`)}
                    className="action-button view"
                  >
                    View Details
                  </button>
                  {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                    <button
                      onClick={() => navigate(`/client/invoices/${invoice.invoice_id}/pay`)}
                      className="action-button pay"
                    >
                      Pay Now
                    </button>
                  )}
                  <button
                    onClick={() => downloadPDF(invoice.invoice_id, invoice.invoice_number)}
                    className="action-button download"
                  >
                    📄 PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>No Invoices Found</h3>
            <p>
              {filter === 'all'
                ? 'You don't have any invoices yet.'
                : `No ${filter.toLowerCase()} invoices found.`}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .invoices-page {
          min-height: 100vh;
          background: #f9fafb;
          padding: 40px 24px;
        }

        .invoices-container {
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

        .page-header {
          margin-bottom: 32px;
        }

        .page-title {
          font-size: 32px;
          font-weight: 800;
          color: #111827;
        }

        /* Filters */
        .filters {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .filter-button {
          padding: 10px 20px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-button:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .filter-button.active {
          background: #667eea;
          border-color: #667eea;
          color: white;
        }

        /* Loading */
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e5e7eb;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Invoices Grid */
        .invoices-grid {
          display: grid;
          gap: 24px;
        }

        .invoice-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }

        .invoice-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .invoice-number {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        .invoice-from {
          font-size: 14px;
          color: #6b7280;
        }

        .invoice-status {
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
        }

        .invoice-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .detail-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
          text-transform: uppercase;
        }

        .detail-value {
          font-size: 15px;
          color: #111827;
          font-weight: 600;
        }

        .detail-value.amount {
          font-size: 20px;
          color: #667eea;
        }

        .invoice-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .action-button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-button.view {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #e5e7eb;
        }

        .action-button.view:hover {
          background: #e5e7eb;
        }

        .action-button.pay {
          background: #667eea;
          color: white;
        }

        .action-button.pay:hover {
          background: #5568d3;
        }

        .action-button.download {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #e5e7eb;
        }

        .action-button.download:hover {
          background: #e5e7eb;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 80px 20px;
          background: white;
          border-radius: 12px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state h3 {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }

        .empty-state p {
          font-size: 14px;
          color: #6b7280;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .invoice-details {
            grid-template-columns: 1fr;
          }

          .invoice-actions {
            flex-direction: column;
          }

          .action-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
