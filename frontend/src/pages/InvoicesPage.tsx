import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoicesAPI, InvoiceListItem, DashboardMetrics } from '../api/invoices';

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'DRAFT':
      return '#9ca3af';
    case 'SENT':
      return '#3b82f6';
    case 'VIEWED':
      return '#8b5cf6';
    case 'PAID':
      return '#10b981';
    case 'OVERDUE':
      return '#ef4444';
    case 'CANCELLED':
      return '#6b7280';
    default:
      return '#9ca3af';
  }
};

export function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInvoices();
    loadMetrics();
  }, [offset, statusFilter]);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const filters: any = { limit: 50, offset };
      if (statusFilter) filters.status = statusFilter;
      if (searchQuery) filters.search = searchQuery;

      const response = await invoicesAPI.list(filters);
      setInvoices(response.invoices);
      setTotal(response.total);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await invoicesAPI.getDashboardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const handleSearch = () => {
    setOffset(0);
    loadInvoices();
  };

  const handleCreateInvoice = () => {
    navigate('/invoices/new');
  };

  const handleViewInvoice = (invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`);
  };

  const limit = 50;
  const hasMore = offset + limit < total;
  const hasPrevious = offset > 0;

  return (
    <div className="invoices-page">
      <div className="page-header">
        <h1>Invoices</h1>
        <button className="create-button" onClick={handleCreateInvoice}>
          Create Invoice
        </button>
      </div>

      {/* Metrics Panel */}
      {metrics && (
        <div className="metrics-panel">
          <div className="metric-card">
            <div className="metric-label">Total Outstanding</div>
            <div className="metric-value">{formatCurrency(metrics.total_outstanding)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Paid This Month</div>
            <div className="metric-value success">{formatCurrency(metrics.total_paid_this_month)}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Overdue</div>
            <div className="metric-value danger">{metrics.overdue_count}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Avg Time to Payment</div>
            <div className="metric-value">{metrics.avg_time_to_payment_days} days</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setOffset(0);
          }}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by invoice number or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="search-input"
          />
          <button onClick={handleSearch} className="search-button">
            Search
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      {isLoading ? (
        <div className="loading">Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <h2>No invoices yet</h2>
          <p>Create your first invoice to get paid.</p>
          <button onClick={handleCreateInvoice} className="create-button">
            Create Invoice
          </button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.invoice_id}>
                    <td>
                      <button
                        className="invoice-link"
                        onClick={() => handleViewInvoice(invoice.invoice_id)}
                      >
                        {invoice.invoice_number}
                      </button>
                    </td>
                    <td>{invoice.site_owner_org_name || invoice.operator_org_name}</td>
                    <td>{invoice.project_name || '-'}</td>
                    <td>{new Date(invoice.issue_date).toLocaleDateString()}</td>
                    <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                    <td>{formatCurrency(invoice.total_amount, invoice.currency)}</td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ background: getStatusBadgeColor(invoice.status) }}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-button"
                        onClick={() => handleViewInvoice(invoice.invoice_id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={!hasPrevious}
              className="page-button"
            >
              Previous
            </button>
            <span className="page-info">
              Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
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
        .invoices-page {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
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

        .create-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .create-button:hover {
          background: #2563eb;
        }

        .metrics-panel {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .metric-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

        .metric-value.success {
          color: #10b981;
        }

        .metric-value.danger {
          color: #ef4444;
        }

        .filters-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-select {
          padding: 10px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .search-bar {
          display: flex;
          gap: 8px;
          flex: 1;
          max-width: 500px;
        }

        .search-input {
          flex: 1;
          padding: 10px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
        }

        .search-button {
          padding: 10px 20px;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .search-button:hover {
          background: #e5e7eb;
        }

        .loading,
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
        }

        .empty-state h2 {
          font-size: 24px;
          color: #111827;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: #6b7280;
          margin-bottom: 24px;
        }

        .table-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .invoices-table {
          width: 100%;
          border-collapse: collapse;
        }

        .invoices-table th {
          background: #f9fafb;
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .invoices-table td {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #111827;
        }

        .invoice-link {
          color: #3b82f6;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          text-decoration: underline;
        }

        .invoice-link:hover {
          color: #2563eb;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .view-button {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .view-button:hover {
          background: #e5e7eb;
        }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
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

        .page-button:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .page-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 14px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .invoices-page {
            padding: 16px;
          }

          .metrics-panel {
            grid-template-columns: 1fr;
          }

          .table-container {
            overflow-x: auto;
          }

          .invoices-table {
            min-width: 800px;
          }
        }
      `}</style>
    </div>
  );
}
