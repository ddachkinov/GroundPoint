import React, { useState } from 'react';
import { Server, Download, Copy, Check, ExternalLink, Terminal } from 'lucide-react';

export function DeploymentPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<'digitalocean' | 'aws' | 'docker'>('digitalocean');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const deploymentCommands = {
    digitalocean: `# Clone the repository
git clone https://github.com/yourusername/GroundPoint.git
cd GroundPoint

# Run the deployment script
chmod +x deploy.sh
./deploy.sh

# Follow the prompts to configure your deployment`,

    aws: `# Install AWS CLI and configure credentials
aws configure

# Clone the repository
git clone https://github.com/yourusername/GroundPoint.git
cd GroundPoint

# Deploy using provided scripts
chmod +x deploy.sh
./deploy.sh --platform=aws`,

    docker: `# Clone the repository
git clone https://github.com/yourusername/GroundPoint.git
cd GroundPoint

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start with Docker Compose
docker-compose up -d

# Access at http://localhost:3000`,
  };

  const platformInfo = {
    digitalocean: {
      name: 'DigitalOcean',
      description: 'Deploy to DigitalOcean Droplets with automated setup',
      estimatedCost: '$40-100/month',
      complexity: 'Easy',
      setupTime: '15-30 minutes',
      features: [
        'Automated SSL certificate setup',
        'Database and Redis provisioning',
        'S3-compatible object storage',
        'Automatic backups',
        'One-click deployment',
      ],
    },
    aws: {
      name: 'Amazon Web Services',
      description: 'Enterprise-grade deployment on AWS infrastructure',
      estimatedCost: '$60-200/month',
      complexity: 'Moderate',
      setupTime: '30-60 minutes',
      features: [
        'EC2, RDS, and ElastiCache',
        'S3 for object storage',
        'CloudFront CDN',
        'Auto-scaling capabilities',
        'Full AWS ecosystem integration',
      ],
    },
    docker: {
      name: 'Docker (Self-Hosted)',
      description: 'Run on your own server with Docker',
      estimatedCost: 'Variable',
      complexity: 'Moderate',
      setupTime: '10-20 minutes',
      features: [
        'Full control over infrastructure',
        'Easy local development',
        'Portable deployment',
        'Minimal dependencies',
        'Container orchestration',
      ],
    },
  };

  const info = platformInfo[selectedPlatform];

  return (
    <div className="deployment-page">
      <div className="deployment-container">
        <div className="deployment-header">
          <div className="header-icon">
            <Server size={48} />
          </div>
          <h1>Deploy Your Own Instance</h1>
          <p>Run GroundPoint on your own infrastructure in minutes</p>
        </div>

        <div className="platform-selector">
          <button
            className={selectedPlatform === 'digitalocean' ? 'active' : ''}
            onClick={() => setSelectedPlatform('digitalocean')}
          >
            <img
              src="https://www.vectorlogo.zone/logos/digitalocean/digitalocean-icon.svg"
              alt="DigitalOcean"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            DigitalOcean
          </button>
          <button
            className={selectedPlatform === 'aws' ? 'active' : ''}
            onClick={() => setSelectedPlatform('aws')}
          >
            <img
              src="https://www.vectorlogo.zone/logos/amazon_aws/amazon_aws-icon.svg"
              alt="AWS"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            AWS
          </button>
          <button
            className={selectedPlatform === 'docker' ? 'active' : ''}
            onClick={() => setSelectedPlatform('docker')}
          >
            <img
              src="https://www.vectorlogo.zone/logos/docker/docker-icon.svg"
              alt="Docker"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            Docker
          </button>
        </div>

        <div className="platform-info">
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Complexity</span>
              <span className={`value complexity-${info.complexity.toLowerCase()}`}>
                {info.complexity}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Setup Time</span>
              <span className="value">{info.setupTime}</span>
            </div>
            <div className="info-item">
              <span className="label">Est. Cost</span>
              <span className="value">{info.estimatedCost}</span>
            </div>
          </div>

          <div className="features-list">
            <h3>Includes:</h3>
            <ul>
              {info.features.map((feature, index) => (
                <li key={index}>
                  <Check size={16} />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="deployment-steps">
          <h2>Quick Start Guide</h2>

          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Prerequisites</h3>
              <ul>
                <li>Node.js 18+ installed</li>
                <li>Docker and Docker Compose (for Docker deployment)</li>
                <li>{info.name} account (for cloud deployments)</li>
                <li>Domain name (optional, but recommended)</li>
              </ul>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Clone and Configure</h3>
              <div className="command-block">
                <pre><code>{deploymentCommands[selectedPlatform]}</code></pre>
                <button
                  className="copy-button"
                  onClick={() => copyToClipboard(deploymentCommands[selectedPlatform], selectedPlatform)}
                >
                  {copied === selectedPlatform ? <Check size={16} /> : <Copy size={16} />}
                  {copied === selectedPlatform ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Configure Environment Variables</h3>
              <p>Edit the <code>.env</code> file with your settings:</p>
              <div className="env-examples">
                <div className="env-item">
                  <strong>DATABASE_URL</strong>
                  <span>PostgreSQL connection string</span>
                </div>
                <div className="env-item">
                  <strong>JWT_SECRET</strong>
                  <span>Random string for JWT tokens</span>
                </div>
                <div className="env-item">
                  <strong>STRIPE_SECRET_KEY</strong>
                  <span>Stripe API key (optional)</span>
                </div>
                <div className="env-item">
                  <strong>AWS_ACCESS_KEY_ID</strong>
                  <span>AWS credentials for S3</span>
                </div>
              </div>
            </div>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Deploy and Launch</h3>
              <p>Run the deployment script and follow the prompts. The script will:</p>
              <ul>
                <li>Set up the database and run migrations</li>
                <li>Configure SSL certificates (if domain provided)</li>
                <li>Start all services (backend, frontend, workers)</li>
                <li>Run health checks</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="resources-section">
          <h2>Documentation & Resources</h2>
          <div className="resources-grid">
            <a href="/DEPLOYMENT.md" className="resource-card" target="_blank">
              <Terminal size={24} />
              <h3>General Deployment Guide</h3>
              <p>Complete deployment instructions for all platforms</p>
              <ExternalLink size={16} />
            </a>
            <a href="/DIGITALOCEAN_DEPLOYMENT.md" className="resource-card" target="_blank">
              <Terminal size={24} />
              <h3>DigitalOcean Guide</h3>
              <p>Step-by-step DigitalOcean deployment walkthrough</p>
              <ExternalLink size={16} />
            </a>
            <a href="/QUICK_START.md" className="resource-card" target="_blank">
              <Terminal size={24} />
              <h3>Quick Start Guide</h3>
              <p>Get up and running in under 15 minutes</p>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        <div className="download-section">
          <h2>Download Deployment Package</h2>
          <p>Get the complete source code and deployment scripts</p>
          <button className="download-button">
            <Download size={20} />
            Download GroundPoint
          </button>
          <p className="download-note">
            Open source under MIT license. Includes all deployment scripts and documentation.
          </p>
        </div>
      </div>

      <style jsx>{`
        .deployment-page {
          min-height: 100vh;
          background: #f9fafb;
          padding: 4rem 2rem;
        }

        .deployment-container {
          max-width: 1000px;
          margin: 0 auto;
        }

        .deployment-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .header-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          color: white;
        }

        .deployment-header h1 {
          font-size: 3rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.75rem;
        }

        .deployment-header p {
          font-size: 1.25rem;
          color: #6b7280;
        }

        .platform-selector {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 3rem;
        }

        .platform-selector button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 1.5rem 2rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 150px;
        }

        .platform-selector button:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .platform-selector button.active {
          border-color: #667eea;
          background: #ede9fe;
        }

        .platform-selector button img {
          width: 40px;
          height: 40px;
        }

        .platform-info {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          margin-bottom: 3rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 2rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .info-item .label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .info-item .value {
          font-size: 1.125rem;
          color: #111827;
          font-weight: 600;
        }

        .complexity-easy {
          color: #10b981;
        }

        .complexity-moderate {
          color: #f59e0b;
        }

        .features-list h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 1rem;
        }

        .features-list ul {
          list-style: none;
          padding: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .features-list li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #4b5563;
        }

        .features-list li svg {
          color: #10b981;
        }

        .deployment-steps {
          margin-bottom: 3rem;
        }

        .deployment-steps h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 2rem;
        }

        .step {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          margin-bottom: 1.5rem;
          display: flex;
          gap: 1.5rem;
        }

        .step-number {
          width: 40px;
          height: 40px;
          background: #667eea;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 1rem;
        }

        .step-content ul {
          color: #4b5563;
          line-height: 1.8;
        }

        .step-content code {
          background: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
        }

        .command-block {
          background: #1f2937;
          color: #f9fafb;
          padding: 1.5rem;
          border-radius: 0.5rem;
          position: relative;
          margin-top: 1rem;
        }

        .command-block pre {
          margin: 0;
          overflow-x: auto;
        }

        .command-block code {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          color: #f9fafb;
          background: transparent;
        }

        .copy-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: #374151;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          transition: background 0.2s;
        }

        .copy-button:hover {
          background: #4b5563;
        }

        .env-examples {
          background: #f9fafb;
          padding: 1.5rem;
          border-radius: 0.5rem;
          margin-top: 1rem;
        }

        .env-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .env-item:last-child {
          border-bottom: none;
        }

        .env-item strong {
          color: #111827;
          font-family: monospace;
        }

        .env-item span {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .resources-section,
        .download-section {
          margin-bottom: 3rem;
        }

        .resources-section h2,
        .download-section h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 2rem;
        }

        .resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .resource-card {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          text-decoration: none;
          color: inherit;
          transition: all 0.3s;
          position: relative;
        }

        .resource-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .resource-card svg:first-child {
          color: #667eea;
          margin-bottom: 1rem;
        }

        .resource-card h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .resource-card p {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 0;
        }

        .resource-card svg:last-child {
          position: absolute;
          top: 2rem;
          right: 2rem;
          color: #9ca3af;
        }

        .download-section {
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 4rem 2rem;
          border-radius: 1.5rem;
          color: white;
        }

        .download-section p {
          font-size: 1.125rem;
          margin-bottom: 2rem;
          opacity: 0.95;
        }

        .download-button {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: white;
          color: #667eea;
          border: none;
          padding: 1.25rem 2.5rem;
          border-radius: 0.75rem;
          font-size: 1.125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .download-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .download-note {
          margin-top: 1rem;
          font-size: 0.875rem;
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .platform-selector {
            flex-direction: column;
          }

          .info-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .features-list ul {
            grid-template-columns: 1fr;
          }

          .step {
            flex-direction: column;
          }

          .resources-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
