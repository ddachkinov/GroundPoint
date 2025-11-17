import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Check, ArrowRight, Camera, TrendingUp, Users, Shield } from 'lucide-react';

// A/B Testing variants
const variants = {
  headlines: [
    'Track Construction Progress from the Sky',
    'Monitor Every Stage of Your Build with Drone Photography',
    'Transform Drone Footage into Actionable Insights',
  ],
  ctas: [
    'Start Free Trial',
    'Try Demo Now',
    'Get Started Free',
  ],
  testimonials: [
    {
      quote: "GroundPoint has revolutionized how we document construction progress. Our clients love the transparency.",
      author: "Mike Johnson",
      role: "Commercial Drone Operator",
      company: "SkyView Imaging"
    },
    {
      quote: "The timeline comparison feature saves us hours of work. We can spot issues before they become problems.",
      author: "Sarah Chen",
      role: "Construction Manager",
      company: "BuildRight Construction"
    },
    {
      quote: "Easy to use, powerful features, and our clients are always impressed with the professional reports.",
      author: "David Martinez",
      role: "Drone Pilot",
      company: "AerialPro Services"
    },
  ],
};

export function LandingPage() {
  const navigate = useNavigate();
  const [variant, setVariant] = useState({
    headline: 0,
    cta: 0,
    testimonial: 0,
  });

  // A/B Testing - randomly assign variants on mount
  useEffect(() => {
    const storedVariant = localStorage.getItem('ab_variant');
    if (storedVariant) {
      setVariant(JSON.parse(storedVariant));
    } else {
      const newVariant = {
        headline: Math.floor(Math.random() * variants.headlines.length),
        cta: Math.floor(Math.random() * variants.ctas.length),
        testimonial: Math.floor(Math.random() * variants.testimonials.length),
      };
      setVariant(newVariant);
      localStorage.setItem('ab_variant', JSON.stringify(newVariant));

      // Track variant assignment
      trackEvent('ab_test_assigned', {
        headline_variant: newVariant.headline,
        cta_variant: newVariant.cta,
        testimonial_variant: newVariant.testimonial,
      });
    }
  }, []);

  const trackEvent = (eventName: string, properties?: any) => {
    // Analytics tracking
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(eventName, properties);
    }
    console.log('Event tracked:', eventName, properties);
  };

  const handleCTAClick = (action: string) => {
    trackEvent('cta_clicked', {
      action,
      variant: variant.cta,
      location: 'hero',
    });

    if (action === 'demo') {
      navigate('/demo');
    } else if (action === 'signup') {
      navigate('/register');
    }
  };

  const handleFeatureClick = (feature: string) => {
    trackEvent('feature_clicked', { feature });
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <div className="logo">
            <Camera className="logo-icon" />
            <span>GroundPoint</span>
          </div>
          <div className="nav-links">
            <a href="#features" onClick={() => trackEvent('nav_clicked', { link: 'features' })}>Features</a>
            <a href="#testimonials" onClick={() => trackEvent('nav_clicked', { link: 'testimonials' })}>Testimonials</a>
            <a href="#pricing" onClick={() => trackEvent('nav_clicked', { link: 'pricing' })}>Pricing</a>
            <button
              className="nav-login"
              onClick={() => {
                trackEvent('nav_clicked', { link: 'login' });
                navigate('/login');
              }}
            >
              Login
            </button>
            <button
              className="nav-signup"
              onClick={() => {
                trackEvent('nav_clicked', { link: 'signup' });
                navigate('/register');
              }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              {variants.headlines[variant.headline]}
            </h1>
            <p className="hero-subtitle">
              Professional drone photography management for construction projects.
              Upload, organize, and share progress updates with clients in real-time.
            </p>
            <div className="hero-cta">
              <button
                className="cta-primary"
                onClick={() => handleCTAClick('demo')}
              >
                <Play className="cta-icon" />
                {variants.ctas[variant.cta]}
              </button>
              <button
                className="cta-secondary"
                onClick={() => handleCTAClick('signup')}
              >
                Sign Up Free
                <ArrowRight className="cta-icon" />
              </button>
            </div>
          </div>
          <div className="hero-image">
            <img
              src="/images/hero-construction.jpg"
              alt="Aerial view of construction site"
              onError={(e) => {
                // Fallback to placeholder
                e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect fill="%23667eea" width="600" height="400"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="24">Construction Site Aerial View</text></svg>';
              }}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="section-container">
          <h2 className="section-title">Everything You Need to Document Progress</h2>
          <p className="section-subtitle">
            Built specifically for drone operators and construction professionals
          </p>

          <div className="features-grid">
            <div className="feature-card" onClick={() => handleFeatureClick('timeline')}>
              <div className="feature-icon">
                <TrendingUp />
              </div>
              <h3>Timeline View</h3>
              <p>Visualize progress over time with our intuitive calendar and timeline interface</p>
            </div>

            <div className="feature-card" onClick={() => handleFeatureClick('comparison')}>
              <div className="feature-icon">
                <Camera />
              </div>
              <h3>Side-by-Side Comparison</h3>
              <p>Compare photos from different dates to track changes and progress</p>
            </div>

            <div className="feature-card" onClick={() => handleFeatureClick('collaboration')}>
              <div className="feature-icon">
                <Users />
              </div>
              <h3>Client Collaboration</h3>
              <p>Share progress updates with clients and stakeholders in real-time</p>
            </div>

            <div className="feature-card" onClick={() => handleFeatureClick('security')}>
              <div className="feature-icon">
                <Shield />
              </div>
              <h3>Secure Storage</h3>
              <p>Enterprise-grade security with automatic backups and data retention</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo CTA Section */}
      <section className="demo-cta">
        <div className="section-container">
          <div className="demo-content">
            <h2>See GroundPoint in Action</h2>
            <p>Explore our interactive demo with real construction project data</p>
            <button
              className="demo-button"
              onClick={() => handleCTAClick('demo')}
            >
              <Play className="demo-icon" />
              Launch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials">
        <div className="section-container">
          <h2 className="section-title">Trusted by Drone Professionals</h2>
          <div className="testimonials-grid">
            {variants.testimonials.map((testimonial, index) => (
              <div key={index} className={`testimonial-card ${index === variant.testimonial ? 'featured' : ''}`}>
                <p className="testimonial-quote">"{testimonial.quote}"</p>
                <div className="testimonial-author">
                  <strong>{testimonial.author}</strong>
                  <span>{testimonial.role}</span>
                  <span className="testimonial-company">{testimonial.company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section id="pricing" className="pricing-preview">
        <div className="section-container">
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-subtitle">Start free, upgrade as you grow</p>
          <div className="pricing-cards">
            <div className="pricing-card">
              <h3>Free</h3>
              <div className="price">$0<span>/mo</span></div>
              <ul>
                <li><Check size={16} /> 2 GB storage</li>
                <li><Check size={16} /> 100 uploads/month</li>
                <li><Check size={16} /> 3 projects</li>
              </ul>
              <button onClick={() => navigate('/register')}>Get Started</button>
            </div>

            <div className="pricing-card featured">
              <div className="popular-badge">Most Popular</div>
              <h3>Professional</h3>
              <div className="price">$49<span>/mo</span></div>
              <ul>
                <li><Check size={16} /> 50 GB storage</li>
                <li><Check size={16} /> 1,000 uploads/month</li>
                <li><Check size={16} /> Unlimited projects</li>
                <li><Check size={16} /> Priority support</li>
              </ul>
              <button onClick={() => navigate('/register')}>Start Trial</button>
            </div>

            <div className="pricing-card">
              <h3>Business</h3>
              <div className="price">$149<span>/mo</span></div>
              <ul>
                <li><Check size={16} /> 500 GB storage</li>
                <li><Check size={16} /> Unlimited uploads</li>
                <li><Check size={16} /> Custom branding</li>
                <li><Check size={16} /> API access</li>
              </ul>
              <button onClick={() => navigate('/register')}>Start Trial</button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="section-container">
          <h2>Ready to Transform Your Workflow?</h2>
          <p>Join hundreds of drone operators using GroundPoint</p>
          <button
            className="cta-large"
            onClick={() => {
              trackEvent('final_cta_clicked');
              navigate('/register');
            }}
          >
            Start Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h4>GroundPoint</h4>
            <p>Professional drone photography management for construction projects</p>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="/demo">Demo</a>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/blog">Blog</a>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 GroundPoint. All rights reserved.</p>
        </div>
      </footer>

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          background: white;
        }

        /* Navigation */
        .nav {
          position: sticky;
          top: 0;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          z-index: 100;
          padding: 1rem 0;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: #667eea;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 2rem;
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

        .nav-login {
          background: transparent;
          border: none;
          color: #4b5563;
          font-weight: 500;
          cursor: pointer;
          padding: 0.5rem 1rem;
        }

        .nav-signup {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .nav-signup:hover {
          background: #5568d3;
        }

        /* Hero Section */
        .hero {
          padding: 6rem 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .hero-content {
          color: white;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 1.5rem;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          opacity: 0.95;
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .hero-cta {
          display: flex;
          gap: 1rem;
        }

        .cta-primary,
        .cta-secondary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 2rem;
          border-radius: 0.75rem;
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .cta-primary {
          background: white;
          color: #667eea;
        }

        .cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .cta-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid white;
        }

        .cta-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .cta-icon {
          width: 20px;
          height: 20px;
        }

        .hero-image {
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        }

        .hero-image img {
          width: 100%;
          height: auto;
          display: block;
        }

        /* Features Section */
        .features {
          padding: 6rem 0;
          background: #f9fafb;
        }

        .section-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 1rem;
          color: #111827;
        }

        .section-subtitle {
          font-size: 1.25rem;
          text-align: center;
          color: #6b7280;
          margin-bottom: 4rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
          transition: all 0.3s;
          cursor: pointer;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: #ede9fe;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #667eea;
          margin-bottom: 1.5rem;
        }

        .feature-card h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #111827;
        }

        .feature-card p {
          color: #6b7280;
          line-height: 1.6;
        }

        /* Demo CTA */
        .demo-cta {
          padding: 4rem 0;
          background: #667eea;
        }

        .demo-content {
          text-align: center;
          color: white;
        }

        .demo-content h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .demo-content p {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          opacity: 0.95;
        }

        .demo-button {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: white;
          color: #667eea;
          border: none;
          padding: 1rem 2.5rem;
          border-radius: 0.75rem;
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .demo-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .demo-icon {
          width: 20px;
          height: 20px;
        }

        /* Testimonials */
        .testimonials {
          padding: 6rem 0;
          background: white;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .testimonial-card {
          background: #f9fafb;
          padding: 2rem;
          border-radius: 1rem;
          border: 2px solid transparent;
          transition: all 0.3s;
        }

        .testimonial-card.featured {
          border-color: #667eea;
          background: white;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.15);
        }

        .testimonial-quote {
          font-size: 1.125rem;
          line-height: 1.6;
          color: #111827;
          margin-bottom: 1.5rem;
          font-style: italic;
        }

        .testimonial-author {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .testimonial-author strong {
          color: #111827;
          font-size: 1rem;
        }

        .testimonial-author span {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .testimonial-company {
          color: #667eea !important;
          font-weight: 500;
        }

        /* Pricing Preview */
        .pricing-preview {
          padding: 6rem 0;
          background: #f9fafb;
        }

        .pricing-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }

        .pricing-card {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
          position: relative;
          transition: all 0.3s;
        }

        .pricing-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
        }

        .pricing-card.featured {
          border: 3px solid #667eea;
          transform: scale(1.05);
        }

        .pricing-card.featured:hover {
          transform: scale(1.05) translateY(-8px);
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #667eea;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .pricing-card h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #111827;
        }

        .price {
          font-size: 3rem;
          font-weight: 800;
          color: #667eea;
          margin-bottom: 2rem;
        }

        .price span {
          font-size: 1.25rem;
          color: #6b7280;
        }

        .pricing-card ul {
          list-style: none;
          padding: 0;
          margin: 0 0 2rem 0;
        }

        .pricing-card li {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0;
          color: #4b5563;
        }

        .pricing-card button {
          width: 100%;
          padding: 1rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .pricing-card button:hover {
          background: #5568d3;
        }

        /* Final CTA */
        .final-cta {
          padding: 6rem 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          text-align: center;
          color: white;
        }

        .final-cta h2 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .final-cta p {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          opacity: 0.95;
        }

        .cta-large {
          background: white;
          color: #667eea;
          border: none;
          padding: 1.25rem 3rem;
          border-radius: 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cta-large:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        }

        /* Footer */
        .footer {
          background: #111827;
          color: white;
          padding: 4rem 0 2rem;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .footer-section h4 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .footer-section a {
          display: block;
          color: #9ca3af;
          text-decoration: none;
          margin-bottom: 0.75rem;
          transition: color 0.2s;
        }

        .footer-section a:hover {
          color: #667eea;
        }

        .footer-section p {
          color: #9ca3af;
          line-height: 1.6;
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 2rem 0;
          border-top: 1px solid #374151;
          text-align: center;
          color: #9ca3af;
        }

        @media (max-width: 768px) {
          .nav-links {
            gap: 1rem;
            font-size: 0.875rem;
          }

          .hero-container {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .hero-cta {
            flex-direction: column;
          }

          .section-title {
            font-size: 2rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .pricing-card.featured {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
