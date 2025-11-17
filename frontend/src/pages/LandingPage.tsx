import { useNavigate } from 'react-router-dom';
import { CheckCircle, Camera, BarChart3, DollarSign, Clock, Shield, Zap, Users, ArrowRight, Play } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Camera className="w-8 h-8" />,
      title: 'Effortless Photo Management',
      description: 'Upload drone photos directly from the field. Organize by date, location, and project milestone automatically.',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Visual Progress Tracking',
      description: 'Compare photos side-by-side across time. Show clients exactly how their project is progressing with powerful comparison tools.',
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: 'Streamlined Invoicing',
      description: 'Generate professional invoices instantly. Get paid faster with integrated Stripe payments and automated reminders.',
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Save Hours Every Week',
      description: 'Stop juggling folders, emails, and spreadsheets. Manage all your construction projects from one beautiful dashboard.',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure & Reliable',
      description: 'Bank-level encryption keeps your data safe. Automatic backups mean you\'ll never lose a photo or project detail.',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Client Portal Access',
      description: 'Give clients real-time access to their projects. They see progress updates instantly, reducing calls and emails.',
    },
  ];

  const benefits = [
    'Turn weeks of photo organization into minutes',
    'Get paid 3x faster with automated invoicing',
    'Impress clients with professional progress reports',
    'Scale your business without hiring more admin staff',
    'Never lose track of project milestones again',
    'Access your projects from any device, anywhere',
  ];

  const testimonials = [
    {
      name: 'Michael Chen',
      role: 'Commercial Drone Operator',
      company: 'SkyView Inspections',
      quote: 'GroundPoint transformed how I deliver value to construction clients. What used to take me 5 hours of organizing photos and creating reports now takes 15 minutes. My clients love the real-time updates.',
      avatar: '👨‍✈️',
    },
    {
      name: 'Sarah Martinez',
      role: 'Drone Service Owner',
      company: 'Elevated Imaging',
      quote: 'The invoicing feature alone paid for itself in the first month. I went from chasing payments for 60+ days to getting paid within 2 weeks. Game changer for cash flow.',
      avatar: '👩‍💼',
    },
    {
      name: 'James Wilson',
      role: 'Construction Site Operator',
      company: 'BuildTrack Aerials',
      quote: 'My construction clients used to bombard me with "where are we at?" calls. Now they log into GroundPoint themselves and see everything. I saved 10+ hours per week on client communication alone.',
      avatar: '👨‍🔧',
    },
  ];

  const stats = [
    { value: '2,500+', label: 'Drone Operators' },
    { value: '15,000+', label: 'Projects Managed' },
    { value: '3.2M+', label: 'Photos Organized' },
    { value: '4.8★', label: 'Average Rating' },
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">📍</span>
            <span className="logo-text">GroundPoint</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#testimonials" className="nav-link">Success Stories</a>
            <button onClick={() => navigate('/login')} className="btn-secondary">
              Log In
            </button>
            <button onClick={() => navigate('/register')} className="btn-primary">
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Zap className="w-4 h-4" />
              <span>Trusted by 2,500+ drone operators worldwide</span>
            </div>
            <h1 className="hero-title">
              Turn Your Drone Photos Into
              <span className="hero-gradient"> Profitable Projects</span>
            </h1>
            <p className="hero-subtitle">
              The all-in-one platform that construction drone operators use to organize photos,
              track progress, invoice clients, and get paid faster. Stop wasting hours on admin work.
              Start impressing clients and growing your business.
            </p>
            <div className="hero-cta">
              <button onClick={() => navigate('/register')} className="btn-hero-primary">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button onClick={() => navigate('/demo')} className="btn-hero-secondary">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </button>
            </div>
            <p className="hero-note">
              ✓ No credit card required &nbsp;&nbsp; ✓ 14-day free trial &nbsp;&nbsp; ✓ Cancel anytime
            </p>
          </div>
          <div className="hero-image">
            <div className="hero-mockup">
              <div className="mockup-header">
                <div className="mockup-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="mockup-title">Construction Site - Week 12</div>
              </div>
              <div className="mockup-content">
                <div className="mockup-grid">
                  <div className="mockup-card">
                    <div className="mockup-image">🏗️</div>
                    <div className="mockup-label">Foundation Complete</div>
                  </div>
                  <div className="mockup-card">
                    <div className="mockup-image">🏢</div>
                    <div className="mockup-label">Framing 65%</div>
                  </div>
                  <div className="mockup-card">
                    <div className="mockup-image">📐</div>
                    <div className="mockup-label">Timeline View</div>
                  </div>
                  <div className="mockup-card">
                    <div className="mockup-image">💰</div>
                    <div className="mockup-label">Invoice Ready</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="problem-solution">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Stop Losing Money on Admin Work</h2>
            <p className="section-subtitle">
              You became a drone operator to fly, not to spend hours organizing photos and chasing payments
            </p>
          </div>
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">😤</div>
              <h3 className="problem-title">The Old Way (Painful)</h3>
              <ul className="problem-list">
                <li>❌ Hours organizing photos in folders</li>
                <li>❌ Creating reports manually in PowerPoint</li>
                <li>❌ Endless "where are we?" client emails</li>
                <li>❌ Waiting 60+ days to get paid</li>
                <li>❌ Losing track of project milestones</li>
                <li>❌ Can't scale beyond 5-10 projects</li>
              </ul>
            </div>
            <div className="arrow-divider">→</div>
            <div className="solution-card">
              <div className="solution-icon">🚀</div>
              <h3 className="solution-title">The GroundPoint Way (Effortless)</h3>
              <ul className="solution-list">
                <li>✅ Auto-organized by date & location</li>
                <li>✅ Beautiful progress reports in 1 click</li>
                <li>✅ Clients check their own portal 24/7</li>
                <li>✅ Get paid in 7-14 days on average</li>
                <li>✅ Timeline view shows everything</li>
                <li>✅ Easily manage 50+ projects</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Everything You Need to Run Your Drone Business</h2>
            <p className="section-subtitle">
              Purpose-built for construction drone operators who want to save time and make more money
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
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="container">
          <div className="benefits-content">
            <div className="benefits-text">
              <h2 className="benefits-title">Why Drone Operators Love GroundPoint</h2>
              <p className="benefits-subtitle">
                Join thousands of operators who've transformed their workflow and grown their revenue
              </p>
              <ul className="benefits-list">
                {benefits.map((benefit, index) => (
                  <li key={index} className="benefit-item">
                    <CheckCircle className="benefit-icon" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate('/register')} className="btn-benefits">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>
            <div className="benefits-visual">
              <div className="visual-card">
                <div className="visual-header">
                  <Users className="w-6 h-6" />
                  <span>Project Dashboard</span>
                </div>
                <div className="visual-body">
                  <div className="visual-stat">
                    <span className="visual-number">12</span>
                    <span className="visual-label">Active Projects</span>
                  </div>
                  <div className="visual-stat">
                    <span className="visual-number">847</span>
                    <span className="visual-label">Photos This Month</span>
                  </div>
                  <div className="visual-stat success">
                    <span className="visual-number">$24,500</span>
                    <span className="visual-label">Revenue This Quarter</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Trusted by Drone Operators Worldwide</h2>
            <p className="section-subtitle">
              See how GroundPoint is helping operators like you scale their business
            </p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-quote">"{testimonial.quote}"</div>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.avatar}</div>
                  <div className="author-info">
                    <div className="author-name">{testimonial.name}</div>
                    <div className="author-role">{testimonial.role}</div>
                    <div className="author-company">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="pricing-preview">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Simple, Transparent Pricing</h2>
            <p className="section-subtitle">
              Start free, upgrade as you grow. No hidden fees, no surprises.
            </p>
          </div>
          <div className="pricing-cards">
            <div className="pricing-card">
              <h3 className="pricing-tier">Free</h3>
              <div className="pricing-price">
                <span className="price-amount">$0</span>
                <span className="price-period">/month</span>
              </div>
              <p className="pricing-description">Perfect for getting started</p>
              <ul className="pricing-features">
                <li>✓ 3 projects</li>
                <li>✓ 100 photos/month</li>
                <li>✓ 2 GB storage</li>
                <li>✓ Basic support</li>
              </ul>
              <button onClick={() => navigate('/register')} className="pricing-button">
                Start Free
              </button>
            </div>
            <div className="pricing-card featured">
              <div className="pricing-badge">Most Popular</div>
              <h3 className="pricing-tier">Professional</h3>
              <div className="pricing-price">
                <span className="price-amount">$49</span>
                <span className="price-period">/month</span>
              </div>
              <p className="pricing-description">For active drone operators</p>
              <ul className="pricing-features">
                <li>✓ Unlimited projects</li>
                <li>✓ 1,000 photos/month</li>
                <li>✓ 50 GB storage</li>
                <li>✓ Priority support</li>
                <li>✓ Advanced analytics</li>
              </ul>
              <button onClick={() => navigate('/register')} className="pricing-button primary">
                Start Free Trial
              </button>
            </div>
            <div className="pricing-card">
              <h3 className="pricing-tier">Business</h3>
              <div className="pricing-price">
                <span className="price-amount">$149</span>
                <span className="price-period">/month</span>
              </div>
              <p className="pricing-description">For growing businesses</p>
              <ul className="pricing-features">
                <li>✓ Everything in Pro</li>
                <li>✓ Unlimited photos</li>
                <li>✓ 500 GB storage</li>
                <li>✓ Custom branding</li>
                <li>✓ API access</li>
              </ul>
              <button onClick={() => navigate('/register')} className="pricing-button">
                Start Free Trial
              </button>
            </div>
          </div>
          <div className="pricing-footer">
            <button onClick={() => navigate('/pricing')} className="btn-pricing-details">
              View Full Pricing Details →
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Transform Your Drone Business?</h2>
            <p className="cta-subtitle">
              Join 2,500+ operators who are saving 10+ hours per week and getting paid faster
            </p>
            <button onClick={() => navigate('/register')} className="btn-cta">
              Start Your Free 14-Day Trial
              <ArrowRight className="w-6 h-6 ml-2" />
            </button>
            <p className="cta-note">
              No credit card required • Full access to all features • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="logo-icon">📍</span>
                <span className="logo-text">GroundPoint</span>
              </div>
              <p className="footer-tagline">
                The professional platform for drone construction operators
              </p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="/demo">Demo</a>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <a href="/about">About</a>
                <a href="/blog">Blog</a>
                <a href="/contact">Contact</a>
              </div>
              <div className="footer-column">
                <h4>Resources</h4>
                <a href="/docs">Documentation</a>
                <a href="/support">Support</a>
                <a href="/api">API</a>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <a href="/privacy">Privacy</a>
                <a href="/terms">Terms</a>
                <a href="/security">Security</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 GroundPoint. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .landing-page {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #1a1a1a;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Navigation */
        .nav {
          position: sticky;
          top: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #e5e7eb;
          z-index: 100;
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

        .nav-logo {
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

        .nav-link {
          color: #4b5563;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }

        .nav-link:hover {
          color: #667eea;
        }

        .btn-secondary {
          padding: 10px 24px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-weight: 600;
          color: #4b5563;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .btn-primary {
          padding: 10px 24px;
          background: #667eea;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #5568d3;
          transform: translateY(-2px);
        }

        /* Hero Section */
        .hero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 100px 24px 120px;
          position: relative;
          overflow: hidden;
        }

        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="url(%23grid)"/></svg>');
          opacity: 0.5;
        }

        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .hero-title {
          font-size: 56px;
          font-weight: 800;
          color: white;
          line-height: 1.1;
          margin-bottom: 24px;
        }

        .hero-gradient {
          background: linear-gradient(to right, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 20px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .hero-cta {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .btn-hero-primary {
          display: flex;
          align-items: center;
          padding: 16px 32px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .btn-hero-primary:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        }

        .btn-hero-secondary {
          display: flex;
          align-items: center;
          padding: 16px 32px;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          backdrop-filter: blur(10px);
        }

        .btn-hero-secondary:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .hero-note {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
        }

        .hero-mockup {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
          transform: perspective(1000px) rotateY(-5deg);
          transition: transform 0.3s;
        }

        .hero-mockup:hover {
          transform: perspective(1000px) rotateY(0deg);
        }

        .mockup-header {
          background: #f3f4f6;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .mockup-dots {
          display: flex;
          gap: 6px;
        }

        .mockup-dots span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #d1d5db;
        }

        .mockup-title {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
        }

        .mockup-content {
          padding: 24px;
        }

        .mockup-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .mockup-card {
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          transition: all 0.2s;
        }

        .mockup-card:hover {
          border-color: #667eea;
          transform: translateY(-4px);
        }

        .mockup-image {
          font-size: 40px;
          margin-bottom: 8px;
        }

        .mockup-label {
          font-size: 13px;
          font-weight: 600;
          color: #4b5563;
        }

        /* Stats Section */
        .stats {
          background: white;
          padding: 60px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .stats-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 48px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: 48px;
          font-weight: 800;
          color: #667eea;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 16px;
          color: #6b7280;
          font-weight: 600;
        }

        /* Problem/Solution Section */
        .problem-solution {
          padding: 100px 24px;
          background: #f9fafb;
        }

        .section-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .section-title {
          font-size: 48px;
          font-weight: 800;
          color: #111827;
          margin-bottom: 16px;
        }

        .section-subtitle {
          font-size: 20px;
          color: #6b7280;
          max-width: 700px;
          margin: 0 auto;
        }

        .problem-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 40px;
          max-width: 1100px;
          margin: 0 auto;
          align-items: start;
        }

        .problem-card, .solution-card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .problem-card {
          border: 3px solid #ef4444;
        }

        .solution-card {
          border: 3px solid #10b981;
        }

        .problem-icon, .solution-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .problem-title, .solution-title {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 24px;
        }

        .problem-list, .solution-list {
          list-style: none;
          padding: 0;
        }

        .problem-list li, .solution-list li {
          padding: 12px 0;
          font-size: 16px;
          line-height: 1.5;
        }

        .arrow-divider {
          font-size: 48px;
          color: #667eea;
          font-weight: 700;
          display: flex;
          align-items: center;
          padding-top: 80px;
        }

        /* Features Section */
        .features {
          padding: 100px 24px;
          background: white;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
        }

        .feature-card {
          padding: 32px;
          background: #f9fafb;
          border-radius: 16px;
          transition: all 0.3s;
        }

        .feature-card:hover {
          background: white;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          transform: translateY(-8px);
        }

        .feature-icon {
          color: #667eea;
          margin-bottom: 20px;
        }

        .feature-title {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #111827;
        }

        .feature-description {
          font-size: 16px;
          color: #6b7280;
          line-height: 1.6;
        }

        /* Benefits Section */
        .benefits {
          padding: 100px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .benefits-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .benefits-title {
          font-size: 42px;
          font-weight: 800;
          color: white;
          margin-bottom: 16px;
        }

        .benefits-subtitle {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 32px;
        }

        .benefits-list {
          list-style: none;
          padding: 0;
          margin-bottom: 32px;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 0;
          color: white;
          font-size: 18px;
          font-weight: 500;
        }

        .benefit-icon {
          color: #fbbf24;
          flex-shrink: 0;
        }

        .btn-benefits {
          display: inline-flex;
          align-items: center;
          padding: 16px 32px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-benefits:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        }

        .benefits-visual {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 32px;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .visual-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
        }

        .visual-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 700;
          color: #111827;
        }

        .visual-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .visual-stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .visual-stat.success {
          background: #d1fae5;
        }

        .visual-number {
          font-size: 32px;
          font-weight: 800;
          color: #111827;
        }

        .visual-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 600;
        }

        /* Testimonials Section */
        .testimonials {
          padding: 100px 24px;
          background: #f9fafb;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        .testimonial-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s;
        }

        .testimonial-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
        }

        .testimonial-quote {
          font-size: 16px;
          line-height: 1.6;
          color: #4b5563;
          margin-bottom: 24px;
        }

        .testimonial-author {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .author-avatar {
          font-size: 48px;
          flex-shrink: 0;
        }

        .author-name {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }

        .author-role {
          font-size: 14px;
          color: #6b7280;
        }

        .author-company {
          font-size: 13px;
          color: #9ca3af;
          font-style: italic;
        }

        /* Pricing Preview */
        .pricing-preview {
          padding: 100px 24px;
          background: white;
        }

        .pricing-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          max-width: 1100px;
          margin: 0 auto 40px;
        }

        .pricing-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 32px;
          position: relative;
          transition: all 0.3s;
        }

        .pricing-card:hover {
          border-color: #667eea;
          transform: translateY(-8px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
        }

        .pricing-card.featured {
          border-color: #667eea;
          border-width: 3px;
          transform: scale(1.05);
        }

        .pricing-card.featured:hover {
          transform: scale(1.05) translateY(-8px);
        }

        .pricing-badge {
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

        .pricing-tier {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
        }

        .pricing-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 12px;
        }

        .price-amount {
          font-size: 48px;
          font-weight: 800;
          color: #667eea;
        }

        .price-period {
          font-size: 18px;
          color: #6b7280;
        }

        .pricing-description {
          color: #6b7280;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 2px solid #f3f4f6;
        }

        .pricing-features {
          list-style: none;
          padding: 0;
          margin-bottom: 32px;
        }

        .pricing-features li {
          padding: 10px 0;
          color: #4b5563;
          font-size: 15px;
        }

        .pricing-button {
          width: 100%;
          padding: 14px;
          border: 2px solid #e5e7eb;
          background: white;
          color: #667eea;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pricing-button:hover {
          border-color: #667eea;
          background: #f9fafb;
        }

        .pricing-button.primary {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .pricing-button.primary:hover {
          background: #5568d3;
        }

        .pricing-footer {
          text-align: center;
        }

        .btn-pricing-details {
          color: #667eea;
          background: none;
          border: none;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-pricing-details:hover {
          text-decoration: underline;
        }

        /* Final CTA */
        .final-cta {
          padding: 100px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .cta-content {
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }

        .cta-title {
          font-size: 48px;
          font-weight: 800;
          color: white;
          margin-bottom: 16px;
        }

        .cta-subtitle {
          font-size: 20px;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 32px;
        }

        .btn-cta {
          display: inline-flex;
          align-items: center;
          padding: 20px 40px;
          background: white;
          color: #667eea;
          border: none;
          border-radius: 12px;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
          margin-bottom: 16px;
        }

        .btn-cta:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }

        .cta-note {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
        }

        /* Footer */
        .footer {
          background: #111827;
          padding: 60px 24px 32px;
        }

        .footer-content {
          display: grid;
          grid-template-columns: 2fr 3fr;
          gap: 60px;
          margin-bottom: 40px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin-bottom: 16px;
        }

        .footer-tagline {
          color: #9ca3af;
          font-size: 14px;
          line-height: 1.6;
        }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 32px;
        }

        .footer-column h4 {
          color: white;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .footer-column a {
          display: block;
          color: #9ca3af;
          text-decoration: none;
          font-size: 14px;
          padding: 6px 0;
          transition: color 0.2s;
        }

        .footer-column a:hover {
          color: #667eea;
        }

        .footer-bottom {
          text-align: center;
          padding-top: 32px;
          border-top: 1px solid #374151;
          color: #9ca3af;
          font-size: 14px;
        }

        /* Responsive Design */
        @media (max-width: 968px) {
          .nav-links {
            gap: 16px;
          }

          .nav-link {
            display: none;
          }

          .hero-container {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .hero-title {
            font-size: 40px;
          }

          .hero-cta {
            flex-direction: column;
          }

          .stats-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 32px;
          }

          .problem-grid {
            grid-template-columns: 1fr;
          }

          .arrow-divider {
            transform: rotate(90deg);
            padding: 0;
            justify-content: center;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .benefits-content {
            grid-template-columns: 1fr;
          }

          .testimonials-grid {
            grid-template-columns: 1fr;
          }

          .pricing-cards {
            grid-template-columns: 1fr;
          }

          .pricing-card.featured {
            transform: scale(1);
          }

          .footer-content {
            grid-template-columns: 1fr;
          }

          .footer-links {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
