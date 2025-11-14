import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionsAPI } from '../api/subscriptions';

interface PricingTier {
  name: string;
  tier: 'FREE' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE';
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  storage: string;
  uploads: string;
  projects: string;
  retention: string;
  popular?: boolean;
}

const tiers: PricingTier[] = [
  {
    name: 'Free',
    tier: 'FREE',
    monthlyPrice: 0,
    yearlyPrice: 0,
    storage: '2 GB',
    uploads: '100/month',
    projects: '3 projects',
    retention: '30 days',
    features: [
      '2 GB storage',
      '100 uploads per month',
      'Up to 3 projects',
      '30-day retention',
      'Basic support',
    ],
  },
  {
    name: 'Professional',
    tier: 'PROFESSIONAL',
    monthlyPrice: 49,
    yearlyPrice: 470,
    storage: '50 GB',
    uploads: '1,000/month',
    projects: 'Unlimited',
    retention: '1 year',
    popular: true,
    features: [
      '50 GB storage',
      '1,000 uploads per month',
      'Unlimited projects',
      '1-year retention',
      'Priority support',
      'Advanced analytics',
      'Export capabilities',
    ],
  },
  {
    name: 'Business',
    tier: 'BUSINESS',
    monthlyPrice: 149,
    yearlyPrice: 1430,
    storage: '500 GB',
    uploads: 'Unlimited',
    projects: 'Unlimited',
    retention: '3 years',
    features: [
      '500 GB storage',
      'Unlimited uploads',
      'Unlimited projects',
      '3-year retention',
      'Dedicated support',
      'Advanced analytics',
      'Export capabilities',
      'Custom branding',
      'API access',
    ],
  },
  {
    name: 'Enterprise',
    tier: 'ENTERPRISE',
    monthlyPrice: 0,
    yearlyPrice: 0,
    storage: 'Unlimited',
    uploads: 'Unlimited',
    projects: 'Unlimited',
    retention: 'Lifetime',
    features: [
      'Unlimited storage',
      'Unlimited uploads',
      'Unlimited projects',
      'Lifetime retention',
      'White-glove support',
      'Custom integrations',
      'SLA guarantees',
      'Dedicated infrastructure',
      'Custom contracts',
    ],
  },
];

export function PricingPage() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSelectPlan = async (tier: PricingTier) => {
    if (tier.tier === 'FREE') {
      // Free tier - just navigate to dashboard
      navigate('/dashboard');
      return;
    }

    if (tier.tier === 'ENTERPRISE') {
      // Enterprise - contact sales
      window.location.href = 'mailto:sales@groundpoint.com';
      return;
    }

    try {
      setIsLoading(tier.tier);

      const session = await subscriptionsAPI.createCheckoutSession(
        tier.tier as 'PROFESSIONAL' | 'BUSINESS',
        billingPeriod
      );

      // Redirect to Stripe Checkout
      window.location.href = session.url;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      alert(error.response?.data?.error || 'Failed to start checkout');
      setIsLoading(null);
    }
  };

  const getPrice = (tier: PricingTier) => {
    if (tier.monthlyPrice === 0) {
      return tier.tier === 'ENTERPRISE' ? 'Contact Sales' : 'Free';
    }

    const price = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice / 12;
    return `$${Math.round(price)}/mo`;
  };

  const getSavings = (tier: PricingTier) => {
    if (tier.monthlyPrice === 0 || billingPeriod === 'monthly') return null;
    const yearlySavings = tier.monthlyPrice * 12 - tier.yearlyPrice;
    return `Save $${yearlySavings}/year`;
  };

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1 className="pricing-title">Choose Your Plan</h1>
        <p className="pricing-subtitle">
          Select the perfect plan for your drone inspection needs
        </p>

        {/* Billing toggle */}
        <div className="billing-toggle">
          <button
            className={billingPeriod === 'monthly' ? 'active' : ''}
            onClick={() => setBillingPeriod('monthly')}
          >
            Monthly
          </button>
          <button
            className={billingPeriod === 'yearly' ? 'active' : ''}
            onClick={() => setBillingPeriod('yearly')}
          >
            Yearly
            <span className="savings-badge">Save 20%</span>
          </button>
        </div>
      </div>

      <div className="pricing-grid">
        {tiers.map((tier) => (
          <div
            key={tier.tier}
            className={`pricing-card ${tier.popular ? 'popular' : ''}`}
          >
            {tier.popular && <div className="popular-badge">Most Popular</div>}

            <div className="tier-header">
              <h2 className="tier-name">{tier.name}</h2>
              <div className="tier-price">
                <span className="price">{getPrice(tier)}</span>
                {getSavings(tier) && (
                  <span className="savings">{getSavings(tier)}</span>
                )}
              </div>
            </div>

            <div className="tier-specs">
              <div className="spec">
                <span className="spec-icon">💾</span>
                <span>{tier.storage}</span>
              </div>
              <div className="spec">
                <span className="spec-icon">📤</span>
                <span>{tier.uploads}</span>
              </div>
              <div className="spec">
                <span className="spec-icon">📁</span>
                <span>{tier.projects}</span>
              </div>
              <div className="spec">
                <span className="spec-icon">🕒</span>
                <span>{tier.retention}</span>
              </div>
            </div>

            <ul className="tier-features">
              {tier.features.map((feature, index) => (
                <li key={index}>
                  <span className="checkmark">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`select-button ${tier.popular ? 'primary' : 'secondary'}`}
              onClick={() => handleSelectPlan(tier)}
              disabled={isLoading === tier.tier}
            >
              {isLoading === tier.tier
                ? 'Loading...'
                : tier.tier === 'ENTERPRISE'
                ? 'Contact Sales'
                : tier.tier === 'FREE'
                ? 'Get Started'
                : 'Upgrade Now'}
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .pricing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 60px 24px;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 60px;
          color: white;
        }

        .pricing-title {
          font-size: 48px;
          font-weight: 800;
          margin-bottom: 16px;
        }

        .pricing-subtitle {
          font-size: 20px;
          opacity: 0.9;
          margin-bottom: 40px;
        }

        .billing-toggle {
          display: inline-flex;
          background: rgba(255, 255, 255, 0.2);
          padding: 6px;
          border-radius: 12px;
          gap: 6px;
        }

        .billing-toggle button {
          padding: 12px 32px;
          border: none;
          background: transparent;
          color: white;
          font-size: 16px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .billing-toggle button.active {
          background: white;
          color: #667eea;
        }

        .savings-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #10b981;
          color: white;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .pricing-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          position: relative;
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .pricing-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }

        .pricing-card.popular {
          border: 3px solid #667eea;
          transform: scale(1.05);
        }

        .pricing-card.popular:hover {
          transform: scale(1.05) translateY(-8px);
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #667eea;
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
        }

        .tier-header {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 2px solid #f3f4f6;
        }

        .tier-name {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 12px;
        }

        .tier-price {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .price {
          font-size: 40px;
          font-weight: 800;
          color: #667eea;
        }

        .savings {
          font-size: 14px;
          color: #10b981;
          font-weight: 600;
        }

        .tier-specs {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 2px solid #f3f4f6;
        }

        .spec {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6b7280;
        }

        .spec-icon {
          font-size: 18px;
        }

        .tier-features {
          list-style: none;
          padding: 0;
          margin: 0 0 32px 0;
        }

        .tier-features li {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          font-size: 15px;
          color: #4b5563;
        }

        .checkmark {
          color: #10b981;
          font-weight: 700;
          font-size: 18px;
        }

        .select-button {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .select-button.primary {
          background: #667eea;
          color: white;
        }

        .select-button.primary:hover:not(:disabled) {
          background: #5568d3;
          transform: translateY(-2px);
        }

        .select-button.secondary {
          background: #f3f4f6;
          color: #667eea;
          border: 2px solid #e5e7eb;
        }

        .select-button.secondary:hover:not(:disabled) {
          background: #e5e7eb;
          border-color: #667eea;
        }

        .select-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .pricing-title {
            font-size: 36px;
          }

          .pricing-subtitle {
            font-size: 16px;
          }

          .pricing-grid {
            grid-template-columns: 1fr;
          }

          .pricing-card.popular {
            transform: scale(1);
          }

          .pricing-card.popular:hover {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
}
