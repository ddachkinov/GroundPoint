import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { invoicesAPI, InvoiceListItem } from '../api/invoices';
import { projectsAPI } from '../api/projects';

interface Project {
  project_id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
}

export function SiteOwnerDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load invoices - backend will filter by organization
      const invoiceData = await invoicesAPI.list({ limit: 10 });
      setInvoices(invoiceData.invoices);

      // Load projects - this will need to be implemented
      // For now, we'll leave it empty
      setProjects([]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInvoiceStatusColor = (status: string) => {
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
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

  return (
    <div className="site-owner-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">📍</span>
            <span className="logo-text">GroundPoint</span>
          </div>
          <div className="header-right">
            <span className="user-name">
              {user?.firstName} {user?.lastName}
            </span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Welcome Section */}
          <section className="welcome-section">
            <h1 className="welcome-title">Welcome back, {user?.firstName}!</h1>
            <p className="welcome-subtitle">
              View your construction project updates and manage your invoices
            </p>
          </section>

          {/* Quick Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📁</div>
              <div className="stat-content">
                <div className="stat-value">{projects.length}</div>
                <div className="stat-label">Active Projects</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📸</div>
              <div className="stat-content">
                <div className="stat-value">0</div>
                <div className="stat-label">New Photos</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💳</div>
              <div className="stat-content">
                <div className="stat-value">
                  {invoices.filter((i) => i.status !== 'PAID').length}
                </div>
                <div className="stat-label">Pending Invoices</div>
              </div>
            </div>
          </div>

          {/* Recent Invoices */}
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Recent Invoices</h2>
              <button
                onClick={() => navigate('/client/invoices')}
                className="view-all-button"
              >
                View All
              </button>
            </div>
            {invoices.length > 0 ? (
              <div className="invoices-list">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.invoice_id}
                    className="invoice-card"
                    onClick={() => navigate(`/client/invoices/${invoice.invoice_id}`)}
                  >
                    <div className="invoice-header">
                      <div>
                        <div className="invoice-number">{invoice.invoice_number}</div>
                        <div className="invoice-project">{invoice.project_name || 'General'}</div>
                      </div>
                      <div
                        className="invoice-status"
                        style={{ background: getInvoiceStatusColor(invoice.status) }}
                      >
                        {invoice.status}
                      </div>
                    </div>
                    <div className="invoice-details">
                      <div className="invoice-detail">
                        <span className="detail-label">Amount:</span>
                        <span className="detail-value">
                          {invoice.currency} ${invoice.total_amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="invoice-detail">
                        <span className="detail-label">Due Date:</span>
                        <span className="detail-value">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="invoice-detail">
                        <span className="detail-label">From:</span>
                        <span className="detail-value">{invoice.operator_org_name}</span>
                      </div>
                    </div>
                    {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                      <button
                        className="pay-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/client/invoices/${invoice.invoice_id}/pay`);
                        }}
                      >
                        Pay Now
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <p className="empty-text">No invoices yet</p>
              </div>
            )}
          </section>

          {/* Projects Section */}
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Your Projects</h2>
              {projects.length > 0 && (
                <button onClick={() => navigate('/client/projects')} className="view-all-button">
                  View All
                </button>
              )}
            </div>
            {projects.length > 0 ? (
              <div className="projects-grid">
                {projects.map((project) => (
                  <div
                    key={project.project_id}
                    className="project-card"
                    onClick={() => navigate(`/client/projects/${project.project_id}`)}
                  >
                    <div className="project-header">
                      <h3 className="project-name">{project.name}</h3>
                      <div className="project-status">{project.status}</div>
                    </div>
                    {project.description && (
                      <p className="project-description">{project.description}</p>
                    )}
                    <div className="project-footer">
                      <span className="project-date">
                        Started {new Date(project.created_at).toLocaleDateString()}
                      </span>
                      <button className="view-photos-button">View Photos →</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <p className="empty-text">No projects yet</p>
                <p className="empty-subtext">
                  Your drone operator will share construction site photos with you here
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <style jsx>{`
        .site-owner-dashboard {
          min-height: 100vh;
          background: #f9fafb;
        }

        /* Header */
        .dashboard-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 16px 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 24px;
          font-weight: 700;
          color: #667eea;
        }

        .logo-icon {
          font-size: 28px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-name {
          font-size: 14px;
          color: #4b5563;
          font-weight: 500;
        }

        .logout-button {
          padding: 8px 16px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-button:hover {
          background: #e5e7eb;
          border-color: #d1d5db;
        }

        /* Main Content */
        .dashboard-main {
          padding: 40px 24px;
        }

        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Welcome Section */
        .welcome-section {
          margin-bottom: 40px;
        }

        .welcome-title {
          font-size: 36px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 8px;
        }

        .welcome-subtitle {
          font-size: 16px;
          color: #6b7280;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-icon {
          font-size: 36px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        /* Section */
        .section {
          background: white;
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 32px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
        }

        .view-all-button {
          padding: 8px 16px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #667eea;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-all-button:hover {
          background: #e5e7eb;
        }

        /* Invoices */
        .invoices-list {
          display: grid;
          gap: 16px;
        }

        .invoice-card {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s;
        }

        .invoice-card:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .invoice-number {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }

        .invoice-project {
          font-size: 14px;
          color: #6b7280;
        }

        .invoice-status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
        }

        .invoice-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .invoice-detail {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detail-label {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .detail-value {
          font-size: 14px;
          color: #111827;
          font-weight: 600;
        }

        .pay-button {
          width: 100%;
          padding: 12px;
          background: #667eea;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pay-button:hover {
          background: #5568d3;
        }

        /* Projects */
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .project-card {
          background: #f9fafb;
          padding: 24px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s;
        }

        .project-card:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .project-name {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
        }

        .project-status {
          padding: 4px 12px;
          background: #10b981;
          color: white;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .project-description {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .project-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .project-date {
          font-size: 13px;
          color: #9ca3af;
        }

        .view-photos-button {
          padding: 6px 12px;
          background: transparent;
          border: none;
          color: #667eea;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-photos-button:hover {
          color: #5568d3;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-text {
          font-size: 18px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .empty-subtext {
          font-size: 14px;
          color: #9ca3af;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .welcome-title {
            font-size: 28px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .projects-grid {
            grid-template-columns: 1fr;
          }

          .invoice-details {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
