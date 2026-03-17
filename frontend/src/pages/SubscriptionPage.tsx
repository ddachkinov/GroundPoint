// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionsAPI, UsageStats } from '../api/subscriptions';

const formatBytes = (bytes: number): string => {
  if (bytes === -1) return 'Unlimited';
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const formatNumber = (num: number): string => {
  if (num === -1) return 'Unlimited';
  return num.toLocaleString();
};

export function SubscriptionPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await subscriptionsAPI.getUsageStats();
      setStats(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load subscription data');
      console.error('Error loading usage stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsProcessing(true);
      const session = await subscriptionsAPI.createPortalSession();
      window.location.href = session.url;
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to open subscription management');
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    try {
      setIsProcessing(true);
      await subscriptionsAPI.cancel();
      await loadUsageStats();
      alert('Your subscription will be cancelled at the end of the billing period');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setIsProcessing(true);
      await subscriptionsAPI.reactivate();
      await loadUsageStats();
      alert('Subscription reactivated successfully');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reactivate subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'FREE':
        return '#6b7280';
      case 'PROFESSIONAL':
        return '#3b82f6';
      case 'BUSINESS':
        return '#8b5cf6';
      case 'ENTERPRISE':
        return '#ec4899';
      default:
        return '#6b7280';
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      ACTIVE: { bg: '#d1fae5', color: '#065f46' },
      PAST_DUE: { bg: '#fee2e2', color: '#991b1b' },
      CANCELLED: { bg: '#e5e7eb', color: '#374151' },
      TRIALING: { bg: '#dbeafe', color: '#1e40af' },
    };

    const style = styles[status] || styles.ACTIVE;

    return (
      <span
        style={{
          background: style.bg,
          color: style.color,
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        {status}
      </span>
    );
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return '#ef4444';
    if (percentage >= 75) return '#f59e0b';
    return '#10b981';
  };

  if (isLoading) {
    return (
      <div className="subscription-loading">
        <div>Loading subscription details...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="subscription-error">
        <h2>Unable to load subscription</h2>
        <p>{error}</p>
        <button onClick={loadUsageStats} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="subscription-page">
      <div className="subscription-header">
        <h1 className="page-title">Subscription & Usage</h1>
      </div>

      {/* Current Plan Card */}
      <div className="plan-card">
        <div className="plan-header">
          <div>
            <h2 className="plan-title" style={{ color: getTierColor(stats.tier) }}>
              {stats.tier} Plan
            </h2>
            <div className="plan-status">{getStatusBadge(stats.status)}</div>
          </div>
          <div className="plan-actions">
            {stats.tier !== 'FREE' && stats.tier !== 'ENTERPRISE' && (
              <button
                className="manage-button"
                onClick={handleManageSubscription}
                disabled={isProcessing}
              >
                Manage Billing
              </button>
            )}
            {stats.tier !== 'ENTERPRISE' && (
              <button className="upgrade-button" onClick={handleUpgrade}>
                {stats.tier === 'FREE' ? 'Upgrade Plan' : 'Change Plan'}
              </button>
            )}
          </div>
        </div>

        {stats.tier !== 'FREE' && (
          <div className="plan-details">
            <div className="detail-item">
              <span className="detail-label">Current Period Ends</span>
              <span className="detail-value">
                {new Date(stats.currentPeriodEnd).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            {stats.cancelAtPeriodEnd && (
              <div className="cancellation-notice">
                <span>⚠️ Your subscription will be cancelled at the end of this period</span>
                <button
                  className="reactivate-button"
                  onClick={handleReactivateSubscription}
                  disabled={isProcessing}
                >
                  Reactivate
                </button>
              </div>
            )}

            {!stats.cancelAtPeriodEnd && stats.status === 'ACTIVE' && (
              <button
                className="cancel-button"
                onClick={handleCancelSubscription}
                disabled={isProcessing}
              >
                Cancel Subscription
              </button>
            )}
          </div>
        )}
      </div>

      {/* Usage Cards */}
      <div className="usage-grid">
        {/* Storage Usage */}
        <div className="usage-card">
          <div className="usage-header">
            <h3 className="usage-title">Storage</h3>
            <span className="usage-value">
              {formatBytes(stats.usage.storage.used)} / {formatBytes(stats.usage.storage.limit)}
            </span>
          </div>
          <div className="usage-bar-container">
            <div
              className="usage-bar"
              style={{
                width: `${Math.min(stats.usage.storage.percentage, 100)}%`,
                background: getUsageColor(stats.usage.storage.percentage),
              }}
            />
          </div>
          {stats.usage.storage.limit !== -1 && (
            <div className="usage-percentage">
              {Math.round(stats.usage.storage.percentage)}% used
            </div>
          )}
        </div>

        {/* Uploads Usage */}
        <div className="usage-card">
          <div className="usage-header">
            <h3 className="usage-title">Uploads This Month</h3>
            <span className="usage-value">
              {formatNumber(stats.usage.uploads.used)} / {formatNumber(stats.usage.uploads.limit)}
            </span>
          </div>
          <div className="usage-bar-container">
            <div
              className="usage-bar"
              style={{
                width: `${Math.min(stats.usage.uploads.percentage, 100)}%`,
                background: getUsageColor(stats.usage.uploads.percentage),
              }}
            />
          </div>
          {stats.usage.uploads.limit !== -1 && (
            <div className="usage-percentage">
              {Math.round(stats.usage.uploads.percentage)}% used
            </div>
          )}
        </div>

        {/* Projects Usage */}
        <div className="usage-card">
          <div className="usage-header">
            <h3 className="usage-title">Projects</h3>
            <span className="usage-value">
              {formatNumber(stats.usage.projects.used)} / {formatNumber(stats.usage.projects.limit)}
            </span>
          </div>
          <div className="usage-bar-container">
            <div
              className="usage-bar"
              style={{
                width: `${Math.min(stats.usage.projects.percentage, 100)}%`,
                background: getUsageColor(stats.usage.projects.percentage),
              }}
            />
          </div>
          {stats.usage.projects.limit !== -1 && (
            <div className="usage-percentage">
              {Math.round(stats.usage.projects.percentage)}% used
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .subscription-page {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .subscription-loading,
        .subscription-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .subscription-error h2 {
          color: #ef4444;
          margin: 0;
        }

        .retry-button {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .subscription-header {
          margin-bottom: 32px;
        }

        .page-title {
          font-size: 32px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .plan-card {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 32px;
        }

        .plan-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .plan-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .plan-status {
          margin-top: 8px;
        }

        .plan-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .manage-button,
        .upgrade-button {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .manage-button {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #e5e7eb;
        }

        .manage-button:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .upgrade-button {
          background: #3b82f6;
          color: white;
          border: none;
        }

        .upgrade-button:hover {
          background: #2563eb;
        }

        .plan-details {
          border-top: 1px solid #e5e7eb;
          padding-top: 24px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .detail-label {
          color: #6b7280;
          font-size: 14px;
        }

        .detail-value {
          color: #111827;
          font-weight: 600;
          font-size: 14px;
        }

        .cancellation-notice {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          padding: 12px 16px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          gap: 16px;
        }

        .cancellation-notice span {
          color: #92400e;
          font-size: 14px;
          font-weight: 500;
        }

        .reactivate-button {
          padding: 8px 16px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .reactivate-button:hover:not(:disabled) {
          background: #059669;
        }

        .cancel-button {
          margin-top: 16px;
          padding: 8px 16px;
          background: transparent;
          color: #ef4444;
          border: 1px solid #ef4444;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .cancel-button:hover:not(:disabled) {
          background: #fef2f2;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .usage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .usage-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .usage-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .usage-title {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }

        .usage-value {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
        }

        .usage-bar-container {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .usage-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s;
        }

        .usage-percentage {
          font-size: 13px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .subscription-page {
            padding: 16px;
          }

          .page-title {
            font-size: 24px;
          }

          .plan-card {
            padding: 20px;
          }

          .plan-header {
            flex-direction: column;
          }

          .plan-actions {
            width: 100%;
          }

          .manage-button,
          .upgrade-button {
            flex: 1;
          }

          .usage-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
