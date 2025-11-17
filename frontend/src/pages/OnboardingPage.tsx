import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Camera, FolderPlus, Upload, Users, X } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  action: () => void;
  actionLabel: string;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Welcome to GroundPoint!',
      description: 'Get started by completing these simple steps',
      icon: <Camera size={24} />,
      completed: true,
      action: () => {},
      actionLabel: 'Done',
    },
    {
      id: 'create-project',
      title: 'Create Your First Project',
      description: 'Set up a project to organize your construction site photos',
      icon: <FolderPlus size={24} />,
      completed: false,
      action: () => navigate('/projects'),
      actionLabel: 'Create Project',
    },
    {
      id: 'upload-photos',
      title: 'Upload Your First Photos',
      description: 'Add drone photos to track construction progress',
      icon: <Upload size={24} />,
      completed: false,
      action: () => navigate('/projects'),
      actionLabel: 'Upload Photos',
    },
    {
      id: 'invite-team',
      title: 'Invite Team Members (Optional)',
      description: 'Collaborate with your team and clients',
      icon: <Users size={24} />,
      completed: false,
      action: () => {
        // In a real app, this would open an invite modal
        alert('Invite feature coming soon! For now, explore the platform.');
      },
      actionLabel: 'Invite Team',
    },
  ]);

  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    // Check if user has completed onboarding before
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (hasCompletedOnboarding) {
      navigate('/dashboard');
    }

    // Track onboarding start
    trackEvent('onboarding_started');
  }, [navigate]);

  const trackEvent = (eventName: string, properties?: any) => {
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track(eventName, properties);
    }
    console.log('Event tracked:', eventName, properties);
  };

  const completeStep = (stepId: string) => {
    setSteps(steps.map(step =>
      step.id === stepId ? { ...step, completed: true } : step
    ));
    trackEvent('onboarding_step_completed', { stepId });
  };

  const skipOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    trackEvent('onboarding_skipped');
    navigate('/dashboard');
  };

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    trackEvent('onboarding_completed');
    navigate('/dashboard');
  };

  const progress = (steps.filter(s => s.completed).length / steps.length) * 100;

  if (!showOnboarding) {
    return null;
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <button className="skip-button" onClick={skipOnboarding}>
            <X size={20} />
            Skip for now
          </button>
        </div>

        <div className="onboarding-content">
          <div className="welcome-section">
            <div className="welcome-icon">
              <Camera size={48} />
            </div>
            <h1>Welcome to GroundPoint!</h1>
            <p>Let's get you set up in just a few quick steps</p>
          </div>

          <div className="progress-section">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-text">
              {steps.filter(s => s.completed).length} of {steps.length} completed
            </span>
          </div>

          <div className="steps-list">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`step-card ${step.completed ? 'completed' : ''}`}
              >
                <div className="step-number">
                  {step.completed ? (
                    <Check size={20} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <div className="step-icon">{step.icon}</div>

                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>

                <div className="step-action">
                  {!step.completed && step.id !== 'welcome' && (
                    <button
                      className="action-button"
                      onClick={() => {
                        completeStep(step.id);
                        step.action();
                      }}
                    >
                      {step.actionLabel}
                    </button>
                  )}
                  {step.completed && (
                    <div className="completed-badge">
                      <Check size={16} />
                      Completed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="onboarding-actions">
            <button className="skip-text-button" onClick={skipOnboarding}>
              I'll do this later
            </button>
            <button
              className="complete-button"
              onClick={completeOnboarding}
              disabled={steps.filter(s => s.completed).length < 2}
            >
              {steps.filter(s => s.completed).length >= 2
                ? 'Go to Dashboard'
                : 'Complete at least one step to continue'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .onboarding-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .onboarding-container {
          background: white;
          border-radius: 1.5rem;
          max-width: 800px;
          width: 100%;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }

        .onboarding-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
        }

        .skip-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: none;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .skip-button:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .onboarding-content {
          padding: 3rem 2rem;
        }

        .welcome-section {
          text-align: center;
          margin-bottom: 3rem;
        }

        .welcome-icon {
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

        .welcome-section h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.75rem;
        }

        .welcome-section p {
          font-size: 1.125rem;
          color: #6b7280;
        }

        .progress-section {
          margin-bottom: 2rem;
        }

        .progress-bar {
          height: 12px;
          background: #e5e7eb;
          border-radius: 1rem;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 1rem;
          transition: width 0.5s ease;
        }

        .progress-text {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .step-card {
          display: grid;
          grid-template-columns: 40px 48px 1fr auto;
          gap: 1rem;
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 1rem;
          border: 2px solid transparent;
          transition: all 0.3s;
        }

        .step-card:hover {
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .step-card.completed {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .step-number {
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #667eea;
          border: 2px solid #667eea;
        }

        .step-card.completed .step-number {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .step-icon {
          width: 48px;
          height: 48px;
          background: white;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #667eea;
        }

        .step-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .step-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }

        .step-content p {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .step-action {
          display: flex;
          align-items: center;
        }

        .action-button {
          background: #667eea;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .action-button:hover {
          background: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .completed-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #10b981;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .onboarding-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .skip-text-button {
          background: transparent;
          border: none;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          padding: 0.75rem 1.5rem;
          transition: color 0.2s;
        }

        .skip-text-button:hover {
          color: #111827;
        }

        .complete-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .complete-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .complete-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .onboarding-page {
            padding: 1rem;
          }

          .onboarding-content {
            padding: 2rem 1rem;
          }

          .welcome-section h1 {
            font-size: 2rem;
          }

          .step-card {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .step-number,
          .step-icon {
            display: none;
          }

          .step-action {
            justify-content: stretch;
          }

          .action-button {
            width: 100%;
          }

          .onboarding-actions {
            flex-direction: column;
            gap: 1rem;
          }

          .complete-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
