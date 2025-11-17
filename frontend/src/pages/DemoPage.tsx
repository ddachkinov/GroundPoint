import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Image as ImageIcon, TrendingUp, ArrowLeft } from 'lucide-react';

// Sample demo data
const demoProjects = [
  {
    id: 'demo-1',
    name: 'Downtown Office Complex',
    location: 'Portland, OR',
    status: 'ACTIVE',
    progress: 65,
    startDate: '2024-01-15',
    lastCapture: '2024-11-15',
    totalCaptures: 124,
  },
  {
    id: 'demo-2',
    name: 'Riverside Residential Development',
    location: 'Seattle, WA',
    status: 'ACTIVE',
    progress: 42,
    startDate: '2024-03-01',
    lastCapture: '2024-11-14',
    totalCaptures: 87,
  },
  {
    id: 'demo-3',
    name: 'Highway Bridge Renovation',
    location: 'Eugene, OR',
    status: 'ACTIVE',
    progress: 88,
    startDate: '2023-09-20',
    lastCapture: '2024-11-10',
    totalCaptures: 256,
  },
];

const demoCaptures = [
  {
    id: 'cap-1',
    projectId: 'demo-1',
    date: '2024-11-15',
    description: 'Foundation complete, steel framework installation in progress',
    thumbnail: '/images/demo/construction-1.jpg',
  },
  {
    id: 'cap-2',
    projectId: 'demo-1',
    date: '2024-10-28',
    description: 'Foundation work nearing completion',
    thumbnail: '/images/demo/construction-2.jpg',
  },
  {
    id: 'cap-3',
    projectId: 'demo-1',
    date: '2024-10-01',
    description: 'Foundation excavation and reinforcement',
    thumbnail: '/images/demo/construction-3.jpg',
  },
  {
    id: 'cap-4',
    projectId: 'demo-2',
    date: '2024-11-14',
    description: 'Phase 1 framing complete, starting Phase 2',
    thumbnail: '/images/demo/construction-4.jpg',
  },
  {
    id: 'cap-5',
    projectId: 'demo-2',
    date: '2024-10-20',
    description: 'Ground preparation and utilities installation',
    thumbnail: '/images/demo/construction-5.jpg',
  },
  {
    id: 'cap-6',
    projectId: 'demo-3',
    date: '2024-11-10',
    description: 'Final paving and road marking in progress',
    thumbnail: '/images/demo/construction-6.jpg',
  },
];

export function DemoPage() {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState(demoProjects[0]);
  const [view, setView] = useState<'projects' | 'timeline' | 'comparison'>('projects');
  const [selectedCaptures, setSelectedCaptures] = useState<string[]>([]);

  const projectCaptures = demoCaptures.filter(c => c.projectId === selectedProject.id);

  const handleCaptureSelect = (captureId: string) => {
    if (selectedCaptures.includes(captureId)) {
      setSelectedCaptures(selectedCaptures.filter(id => id !== captureId));
    } else if (selectedCaptures.length < 2) {
      setSelectedCaptures([...selectedCaptures, captureId]);
    }
  };

  const trackDemoInteraction = (action: string, data?: any) => {
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('demo_interaction', { action, ...data });
    }
    console.log('Demo interaction:', action, data);
  };

  return (
    <div className="demo-page">
      {/* Header */}
      <div className="demo-header">
        <div className="header-content">
          <button className="back-button" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
            Back to Home
          </button>
          <h1>GroundPoint Demo</h1>
          <p>Explore with real construction project data</p>
        </div>
        <div className="demo-banner">
          <span>You're viewing demo mode</span>
          <button
            className="signup-banner-btn"
            onClick={() => {
              trackDemoInteraction('signup_from_demo');
              navigate('/register');
            }}
          >
            Sign Up to Create Your Own Projects
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="demo-nav">
        <button
          className={view === 'projects' ? 'active' : ''}
          onClick={() => {
            setView('projects');
            trackDemoInteraction('view_changed', { view: 'projects' });
          }}
        >
          <TrendingUp size={20} />
          Projects
        </button>
        <button
          className={view === 'timeline' ? 'active' : ''}
          onClick={() => {
            setView('timeline');
            trackDemoInteraction('view_changed', { view: 'timeline' });
          }}
        >
          <Calendar size={20} />
          Timeline
        </button>
        <button
          className={view === 'comparison' ? 'active' : ''}
          onClick={() => {
            setView('comparison');
            trackDemoInteraction('view_changed', { view: 'comparison' });
          }}
        >
          <ImageIcon size={20} />
          Compare
        </button>
      </div>

      {/* Content Area */}
      <div className="demo-content">
        {view === 'projects' && (
          <div className="projects-view">
            <h2>Your Projects</h2>
            <div className="projects-grid">
              {demoProjects.map(project => (
                <div
                  key={project.id}
                  className={`project-card ${selectedProject.id === project.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedProject(project);
                    trackDemoInteraction('project_selected', { projectId: project.id });
                  }}
                >
                  <div className="project-header">
                    <h3>{project.name}</h3>
                    <span className={`status-badge ${project.status.toLowerCase()}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="project-location">{project.location}</p>
                  <div className="project-stats">
                    <div className="stat">
                      <span className="label">Progress</span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="value">{project.progress}%</span>
                    </div>
                    <div className="stat">
                      <span className="label">Total Captures</span>
                      <span className="value">{project.totalCaptures}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Last Capture</span>
                      <span className="value">{new Date(project.lastCapture).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cta-card">
              <h3>Ready to manage your own projects?</h3>
              <p>Sign up now to start tracking your construction sites</p>
              <button
                onClick={() => {
                  trackDemoInteraction('signup_from_projects');
                  navigate('/register');
                }}
              >
                Create Free Account
              </button>
            </div>
          </div>
        )}

        {view === 'timeline' && (
          <div className="timeline-view">
            <h2>{selectedProject.name} - Timeline</h2>
            <div className="timeline">
              {projectCaptures.map((capture, index) => (
                <div key={capture.id} className="timeline-item">
                  <div className="timeline-date">
                    {new Date(capture.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="timeline-connector">
                    <div className="timeline-dot" />
                    {index < projectCaptures.length - 1 && <div className="timeline-line" />}
                  </div>
                  <div className="timeline-content">
                    <div
                      className="capture-thumbnail"
                      onClick={() => trackDemoInteraction('capture_viewed', { captureId: capture.id })}
                    >
                      <img
                        src={capture.thumbnail}
                        alt={capture.description}
                        onError={(e) => {
                          e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23667eea" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="16">Construction Photo ${index + 1}</text></svg>`;
                        }}
                      />
                    </div>
                    <p className="capture-description">{capture.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'comparison' && (
          <div className="comparison-view">
            <h2>Compare Progress Over Time</h2>
            <p className="comparison-hint">
              Select two photos to compare side-by-side
            </p>

            <div className="captures-grid">
              {projectCaptures.map(capture => (
                <div
                  key={capture.id}
                  className={`capture-card ${selectedCaptures.includes(capture.id) ? 'selected' : ''}`}
                  onClick={() => {
                    handleCaptureSelect(capture.id);
                    trackDemoInteraction('capture_selected_for_comparison', { captureId: capture.id });
                  }}
                >
                  <img
                    src={capture.thumbnail}
                    alt={capture.description}
                    onError={(e) => {
                      e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect fill="%23667eea" width="300" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="14">Photo</text></svg>`;
                    }}
                  />
                  <div className="capture-info">
                    <span className="capture-date">
                      {new Date(capture.date).toLocaleDateString()}
                    </span>
                    {selectedCaptures.includes(capture.id) && (
                      <span className="selected-badge">
                        {selectedCaptures.indexOf(capture.id) + 1}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {selectedCaptures.length === 2 && (
              <div className="comparison-viewer">
                <h3>Side-by-Side Comparison</h3>
                <div className="comparison-images">
                  {selectedCaptures.map(captureId => {
                    const capture = demoCaptures.find(c => c.id === captureId);
                    if (!capture) return null;
                    return (
                      <div key={captureId} className="comparison-image">
                        <img
                          src={capture.thumbnail}
                          alt={capture.description}
                          onError={(e) => {
                            e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400"><rect fill="%23667eea" width="500" height="400"/><text x="50%" y="50%" text-anchor="middle" fill="white" font-size="16">Construction Photo</text></svg>`;
                          }}
                        />
                        <div className="comparison-label">
                          {new Date(capture.date).toLocaleDateString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .demo-page {
          min-height: 100vh;
          background: #f9fafb;
        }

        .demo-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          cursor: pointer;
          margin-bottom: 1rem;
          transition: background 0.2s;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .header-content h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .header-content p {
          font-size: 1.25rem;
          opacity: 0.9;
        }

        .demo-banner {
          max-width: 1200px;
          margin: 1.5rem auto 0;
          background: rgba(255, 255, 255, 0.15);
          padding: 1rem;
          border-radius: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          backdrop-filter: blur(10px);
        }

        .demo-banner span {
          font-weight: 500;
        }

        .signup-banner-btn {
          background: white;
          color: #667eea;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .signup-banner-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .demo-nav {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          gap: 0;
          max-width: 1200px;
          margin: 0 auto;
        }

        .demo-nav button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border: none;
          background: transparent;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .demo-nav button:hover {
          color: #667eea;
          background: #f9fafb;
        }

        .demo-nav button.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .demo-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .projects-view h2,
        .timeline-view h2,
        .comparison-view h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 2rem;
          color: #111827;
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .project-card {
          background: white;
          padding: 1.5rem;
          border-radius: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          cursor: pointer;
          transition: all 0.3s;
          border: 2px solid transparent;
        }

        .project-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .project-card.selected {
          border-color: #667eea;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 0.5rem;
        }

        .project-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #065f46;
        }

        .project-location {
          color: #6b7280;
          margin-bottom: 1rem;
        }

        .project-stats {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat .label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .stat .value {
          font-weight: 600;
          color: #111827;
        }

        .progress-bar {
          height: 8px;
          background: #e5e7eb;
          border-radius: 1rem;
          overflow: hidden;
          margin: 0.25rem 0;
        }

        .progress-fill {
          height: 100%;
          background: #667eea;
          border-radius: 1rem;
          transition: width 0.5s;
        }

        .cta-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 1rem;
          text-align: center;
        }

        .cta-card h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .cta-card p {
          margin-bottom: 1.5rem;
          opacity: 0.95;
        }

        .cta-card button {
          background: white;
          color: #667eea;
          border: none;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cta-card button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .timeline {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .timeline-item {
          display: grid;
          grid-template-columns: 120px 60px 1fr;
          gap: 1rem;
        }

        .timeline-date {
          text-align: right;
          color: #6b7280;
          font-weight: 500;
          padding-top: 0.5rem;
        }

        .timeline-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .timeline-dot {
          width: 16px;
          height: 16px;
          background: #667eea;
          border-radius: 50%;
          border: 4px solid #ede9fe;
        }

        .timeline-line {
          width: 2px;
          flex: 1;
          background: #e5e7eb;
          margin-top: 0.5rem;
        }

        .timeline-content {
          background: white;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .capture-thumbnail {
          cursor: pointer;
          transition: transform 0.3s;
        }

        .capture-thumbnail:hover {
          transform: scale(1.02);
        }

        .capture-thumbnail img {
          width: 100%;
          height: auto;
          display: block;
        }

        .capture-description {
          padding: 1rem;
          color: #4b5563;
        }

        .comparison-view .comparison-hint {
          color: #6b7280;
          margin-bottom: 2rem;
          font-size: 1.125rem;
        }

        .captures-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .capture-card {
          background: white;
          border-radius: 0.75rem;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;
          border: 3px solid transparent;
          position: relative;
        }

        .capture-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .capture-card.selected {
          border-color: #667eea;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
        }

        .capture-card img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        .capture-info {
          padding: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .capture-date {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .selected-badge {
          background: #667eea;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .comparison-viewer {
          background: white;
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .comparison-viewer h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          color: #111827;
        }

        .comparison-images {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .comparison-image {
          position: relative;
        }

        .comparison-image img {
          width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }

        .comparison-label {
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          background: rgba(0, 0, 0, 0.75);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .demo-banner {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .projects-grid {
            grid-template-columns: 1fr;
          }

          .timeline-item {
            grid-template-columns: 1fr;
          }

          .timeline-date {
            text-align: left;
          }

          .timeline-connector {
            display: none;
          }

          .comparison-images {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
