import React from 'react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: '📸',
      title: 'Drone Photo Management',
      description: 'Effortlessly upload, organize, and manage construction site photos captured by drones. Track progress over time with intelligent timeline views.'
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Monitor construction progress with before/after comparisons and automated timeline generation. Share updates with stakeholders instantly.'
    },
    {
      icon: '🔐',
      title: 'Secure Client Portal',
      description: 'Give your clients secure access to view their project photos and pay invoices. Professional, branded experience for site owners.'
    },
    {
      icon: '💳',
      title: 'Automated Billing',
      description: 'Integrated invoicing and payment processing with Stripe. Automatic invoice generation, online payments, and receipt management.'
    },
    {
      icon: '📱',
      title: 'Mobile Friendly',
      description: 'Access your projects from any device. Upload photos from the field and share updates with clients on the go.'
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Optimized image processing and delivery. Pre-signed URLs for secure, high-speed photo access and downloads.'
    }
  ];

  const pricingTiers = [
    {
      name: 'Professional',
      price: '$49',
      period: '/month',
      features: [
        '50 GB storage',
        '1,000 uploads/month',
        'Unlimited projects',
        '1-year retention',
        'Priority support'
      ],
      popular: true
    },
    {
      name: 'Business',
      price: '$149',
      period: '/month',
      features: [
        '500 GB storage',
        'Unlimited uploads',
        'Unlimited projects',
        '3-year retention',
        'Custom branding',
        'API access'
      ]
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: [
        'Unlimited storage',
        'Unlimited uploads',
        'Lifetime retention',
        'White-glove support',
        'Custom integrations',
        'SLA guarantees'
      ]
    }
  ];

  const faqs = [
    {
      question: 'How quickly can I get started?',
      answer: 'You can sign up and start uploading photos in less than 5 minutes. Our automated deployment creates your instance instantly upon subscription.'
    },
    {
      question: 'What file formats are supported?',
      answer: 'We support all common image formats including JPG, PNG, TIFF, and DNG (RAW). Videos are also supported with automatic processing.'
    },
    {
      question: 'Can my clients access their photos?',
      answer: 'Yes! Each project comes with a secure client portal where site owners can view photos, track progress, and pay invoices online.'
    },
    {
      question: 'How does billing work?',
      answer: 'Choose monthly or yearly billing. All plans include automated invoice generation for your clients with integrated Stripe payments.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use enterprise-grade encryption, secure S3 storage, JWT authentication, and follow industry best practices for data protection.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, cancel anytime with no penalties. Your data is retained according to your plan tier, and you can export everything before canceling.'
    }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">📍</span>
            <span className="logo-text">GroundPoint</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#demo">Demo</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
            <button onClick={() => navigate('/login')} className="nav-button login">
              Login
            </button>
            <button onClick={() => navigate('/register')} className="nav-button signup">
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Drone Construction Photography,
            <span className="gradient-text"> Simplified</span>
          </h1>
          <p className="hero-subtitle">
            The all-in-one platform for drone operators to manage construction site photos,
            track progress, and deliver professional results to clients.
            Upload, organize, invoice, and get paid—all in one place.
          </p>
          <div className="hero-buttons">
            <button onClick={() => navigate('/register')} className="cta-primary">
              Start Free Trial
            </button>
            <button onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })} className="cta-secondary">
              Watch Demo
            </button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Photos Managed</div>
            </div>
            <div className="stat">
              <div className="stat-number">500+</div>
              <div className="stat-label">Projects Tracked</div>
            </div>
            <div className="stat">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="section-header">
          <h2 className="section-title">Everything You Need</h2>
          <p className="section-subtitle">
            Powerful features designed for professional drone operators
          </p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="demo">
        <div className="section-header">
          <h2 className="section-title">See It In Action</h2>
          <p className="section-subtitle">
            Watch how GroundPoint streamlines your workflow
          </p>
        </div>
        <div className="demo-container">
          <div className="demo-video">
            <div className="video-placeholder">
              <div className="play-button">▶</div>
              <p>Product Demo Video</p>
              <span className="video-duration">2:30</span>
            </div>
          </div>
          <div className="demo-features">
            <h3>What You'll See:</h3>
            <ul>
              <li>
                <span className="check">✓</span>
                Upload and organize drone photos in seconds
              </li>
              <li>
                <span className="check">✓</span>
                Create projects and assign photos to sites
              </li>
              <li>
                <span className="check">✓</span>
                Timeline views with before/after comparisons
              </li>
              <li>
                <span className="check">✓</span>
                Generate and send invoices to clients
              </li>
              <li>
                <span className="check">✓</span>
                Client portal for viewing progress
              </li>
              <li>
                <span className="check">✓</span>
                Automated payment processing with Stripe
              </li>
            </ul>
            <button onClick={() => navigate('/register')} className="demo-cta">
              Try It Free
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <div className="section-header">
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-subtitle">
            Choose the plan that fits your business. Start free, upgrade anytime.
          </p>
        </div>
        <div className="pricing-grid">
          {pricingTiers.map((tier, index) => (
            <div key={index} className={`pricing-card ${tier.popular ? 'popular' : ''}`}>
              {tier.popular && <div className="popular-badge">Most Popular</div>}
              <h3 className="tier-name">{tier.name}</h3>
              <div className="tier-price">
                <span className="price">{tier.price}</span>
                <span className="period">{tier.period}</span>
              </div>
              <ul className="tier-features">
                {tier.features.map((feature, idx) => (
                  <li key={idx}>
                    <span className="check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/register')}
                className={tier.popular ? 'tier-button primary' : 'tier-button secondary'}
              >
                {tier.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
        <div className="pricing-note">
          All plans include: Automated billing, secure cloud storage, mobile access, and email support
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq">
        <div className="section-header">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Everything you need to know about GroundPoint
          </p>
        </div>
        <div className="faq-grid">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <h3 className="faq-question">{faq.question}</h3>
              <p className="faq-answer">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="final-cta">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your Workflow?</h2>
          <p className="cta-subtitle">
            Join hundreds of drone operators who trust GroundPoint for their construction photography needs
          </p>
          <button onClick={() => navigate('/register')} className="cta-button">
            Start Your Free Trial
          </button>
          <p className="cta-note">No credit card required • Cancel anytime • 14-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="logo-icon">📍</span>
              <span className="logo-text">GroundPoint</span>
            </div>
            <p className="footer-description">
              Professional drone construction photography management platform
            </p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#demo">Demo</a>
            <a href="#pricing">Pricing</a>
            <a href="/login">Login</a>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <a href="#faq">FAQ</a>
            <a href="mailto:support@groundpoint.com">Contact</a>
            <a href="#">Documentation</a>
            <a href="#">API</a>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 GroundPoint. All rights reserved.</p>
        </div>
      </footer>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: white;
          color: #1f2937;
        }

        /* Navbar */
        .navbar {
          position: fixed;
          top: 0;
          width: 100%;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #e5e7eb;
          z-index: 1000;
          padding: 16px 0;
        }

        .nav-container {
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

        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .nav-links a {
          color: #4b5563;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-links a:hover {
          color: #667eea;
        }

        .nav-button {
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .nav-button.login {
          background: transparent;
          color: #667eea;
        }

        .nav-button.login:hover {
          background: #f3f4f6;
        }

        .nav-button.signup {
          background: #667eea;
          color: white;
        }

        .nav-button.signup:hover {
          background: #5568d3;
        }

        /* Hero Section */
        .hero {
          margin-top: 80px;
          padding: 100px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
        }

        .hero-content {
          max-width: 1000px;
          margin: 0 auto;
        }

        .hero-title {
          font-size: 64px;
          font-weight: 900;
          line-height: 1.2;
          margin-bottom: 24px;
        }

        .gradient-text {
          background: linear-gradient(90deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 20px;
          line-height: 1.6;
          opacity: 0.95;
          margin-bottom: 48px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 80px;
        }

        .cta-primary {
          padding: 18px 48px;
          font-size: 18px;
          font-weight: 700;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .cta-secondary {
          padding: 18px 48px;
          font-size: 18px;
          font-weight: 700;
          background: transparent;
          color: white;
          border: 2px solid white;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cta-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .hero-stats {
          display: flex;
          justify-content: center;
          gap: 80px;
        }

        .stat {
          text-align: center;
        }

        .stat-number {
          font-size: 48px;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          opacity: 0.9;
          font-weight: 500;
        }

        /* Features Section */
        .features {
          padding: 100px 24px;
          background: #f9fafb;
        }

        .section-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .section-title {
          font-size: 48px;
          font-weight: 900;
          color: #111827;
          margin-bottom: 16px;
        }

        .section-subtitle {
          font-size: 20px;
          color: #6b7280;
        }

        .features-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 40px;
        }

        .feature-card {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition: all 0.3s;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .feature-icon {
          font-size: 48px;
          margin-bottom: 24px;
        }

        .feature-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 12px;
        }

        .feature-description {
          font-size: 16px;
          color: #6b7280;
          line-height: 1.6;
        }

        /* Demo Section */
        .demo {
          padding: 100px 24px;
          background: white;
        }

        .demo-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .demo-video {
          background: #f3f4f6;
          border-radius: 16px;
          overflow: hidden;
          aspect-ratio: 16/9;
        }

        .video-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          position: relative;
        }

        .play-button {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 16px;
        }

        .play-button:hover {
          background: rgba(255, 255, 255, 0.4);
          transform: scale(1.1);
        }

        .video-duration {
          position: absolute;
          bottom: 16px;
          right: 16px;
          background: rgba(0, 0, 0, 0.7);
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
        }

        .demo-features h3 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 24px;
          color: #111827;
        }

        .demo-features ul {
          list-style: none;
          padding: 0;
          margin: 0 0 32px 0;
        }

        .demo-features li {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          font-size: 16px;
          color: #4b5563;
        }

        .check {
          color: #10b981;
          font-weight: 700;
          font-size: 20px;
        }

        .demo-cta {
          padding: 16px 40px;
          font-size: 16px;
          font-weight: 700;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .demo-cta:hover {
          background: #5568d3;
          transform: translateY(-2px);
        }

        /* Pricing Section */
        .pricing {
          padding: 100px 24px;
          background: #f9fafb;
        }

        .pricing-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 32px;
        }

        .pricing-card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          position: relative;
          transition: all 0.3s;
        }

        .pricing-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .pricing-card.popular {
          border: 3px solid #667eea;
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

        .tier-name {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
        }

        .tier-price {
          margin-bottom: 32px;
        }

        .price {
          font-size: 48px;
          font-weight: 900;
          color: #667eea;
        }

        .period {
          font-size: 18px;
          color: #6b7280;
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

        .tier-button {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tier-button.primary {
          background: #667eea;
          color: white;
        }

        .tier-button.primary:hover {
          background: #5568d3;
        }

        .tier-button.secondary {
          background: #f3f4f6;
          color: #667eea;
          border: 2px solid #e5e7eb;
        }

        .tier-button.secondary:hover {
          background: #e5e7eb;
          border-color: #667eea;
        }

        .pricing-note {
          text-align: center;
          margin-top: 48px;
          color: #6b7280;
          font-size: 14px;
        }

        /* FAQ Section */
        .faq {
          padding: 100px 24px;
          background: white;
        }

        .faq-grid {
          max-width: 900px;
          margin: 0 auto;
          display: grid;
          gap: 32px;
        }

        .faq-item {
          background: #f9fafb;
          padding: 32px;
          border-radius: 12px;
          border-left: 4px solid #667eea;
        }

        .faq-question {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 12px;
        }

        .faq-answer {
          font-size: 16px;
          color: #6b7280;
          line-height: 1.6;
        }

        /* Final CTA */
        .final-cta {
          padding: 100px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          text-align: center;
          color: white;
        }

        .cta-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .cta-title {
          font-size: 48px;
          font-weight: 900;
          margin-bottom: 16px;
        }

        .cta-subtitle {
          font-size: 20px;
          opacity: 0.95;
          margin-bottom: 40px;
        }

        .cta-button {
          padding: 18px 48px;
          font-size: 18px;
          font-weight: 700;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .cta-note {
          margin-top: 24px;
          font-size: 14px;
          opacity: 0.9;
        }

        /* Footer */
        .footer {
          background: #1f2937;
          color: white;
          padding: 60px 24px 30px;
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 40px;
          margin-bottom: 40px;
        }

        .footer-section h4 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 16px;
          color: white;
        }

        .footer-section a {
          display: block;
          color: #9ca3af;
          text-decoration: none;
          margin-bottom: 12px;
          transition: color 0.2s;
        }

        .footer-section a:hover {
          color: #667eea;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .footer-description {
          color: #9ca3af;
          font-size: 14px;
          line-height: 1.6;
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 30px;
          border-top: 1px solid #374151;
          text-align: center;
          color: #9ca3af;
          font-size: 14px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-links {
            gap: 16px;
          }

          .nav-links a {
            display: none;
          }

          .hero-title {
            font-size: 40px;
          }

          .hero-subtitle {
            font-size: 16px;
          }

          .hero-buttons {
            flex-direction: column;
          }

          .hero-stats {
            flex-direction: column;
            gap: 32px;
          }

          .section-title {
            font-size: 32px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .demo-container {
            grid-template-columns: 1fr;
          }

          .pricing-grid {
            grid-template-columns: 1fr;
          }

          .cta-title {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  );
}
