// @ts-nocheck
import React, { useEffect } from 'react';
import { Capture } from '../../api/captures';

interface ImageLightboxProps {
  capture: Capture | null;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onDelete?: () => void;
  onAddToComparison?: () => void;
}

/**
 * Image lightbox for viewing full-size captures
 */
export function ImageLightbox({
  capture,
  onClose,
  onNext,
  onPrevious,
  onDelete,
  onAddToComparison,
}: ImageLightboxProps) {
  const [showMetadata, setShowMetadata] = React.useState(false);

  // Handle keyboard navigation
  useEffect(() => {
    if (!capture) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrevious?.();
          break;
        case 'ArrowRight':
          onNext?.();
          break;
        case 'm':
        case 'M':
          setShowMetadata((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [capture, onClose, onNext, onPrevious]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (capture) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [capture]);

  if (!capture) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="lightbox-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {/* Navigation buttons */}
        {onPrevious && (
          <button className="lightbox-nav lightbox-nav-prev" onClick={onPrevious} aria-label="Previous">
            ←
          </button>
        )}
        {onNext && (
          <button className="lightbox-nav lightbox-nav-next" onClick={onNext} aria-label="Next">
            →
          </button>
        )}

        {/* Image */}
        <div className="lightbox-image-container">
          {capture.file_url ? (
            <img
              src={capture.file_url}
              alt={`${capture.angle_name} - ${capture.capture_date}`}
              className="lightbox-image"
            />
          ) : (
            <div className="lightbox-no-image">
              <div className="lightbox-processing-badge">{capture.processing_status}</div>
              <div>Full image not available</div>
            </div>
          )}
        </div>

        {/* Actions bar */}
        <div className="lightbox-actions">
          <button className="lightbox-action-button" onClick={() => setShowMetadata(!showMetadata)}>
            {showMetadata ? 'Hide' : 'Show'} Info
          </button>
          {onAddToComparison && (
            <button className="lightbox-action-button" onClick={onAddToComparison}>
              Add to Comparison
            </button>
          )}
          {capture.file_url && (
            <a
              href={capture.file_url}
              download
              className="lightbox-action-button"
              onClick={(e) => e.stopPropagation()}
            >
              Download
            </a>
          )}
          {onDelete && (
            <button className="lightbox-action-button lightbox-delete" onClick={onDelete}>
              Delete
            </button>
          )}
        </div>

        {/* Metadata panel */}
        {showMetadata && (
          <div className="lightbox-metadata">
            <h3 className="metadata-title">Capture Information</h3>
            <div className="metadata-grid">
              <div className="metadata-item">
                <div className="metadata-label">Date</div>
                <div className="metadata-value">
                  {new Date(capture.capture_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Site</div>
                <div className="metadata-value">{capture.site_name}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Angle</div>
                <div className="metadata-value">{capture.angle_name}</div>
              </div>
              <div className="metadata-item">
                <div className="metadata-label">Uploaded By</div>
                <div className="metadata-value">{capture.uploaded_by_user_name}</div>
              </div>
              {capture.latitude && capture.longitude && (
                <div className="metadata-item">
                  <div className="metadata-label">GPS Coordinates</div>
                  <div className="metadata-value">
                    {capture.latitude}, {capture.longitude}
                  </div>
                </div>
              )}
              {capture.weather && (
                <div className="metadata-item">
                  <div className="metadata-label">Weather</div>
                  <div className="metadata-value">{capture.weather}</div>
                </div>
              )}
              {capture.image_width && capture.image_height && (
                <div className="metadata-item">
                  <div className="metadata-label">Dimensions</div>
                  <div className="metadata-value">
                    {capture.image_width} × {capture.image_height} px
                  </div>
                </div>
              )}
              <div className="metadata-item">
                <div className="metadata-label">File Size</div>
                <div className="metadata-value">
                  {(Number(capture.file_size) / (1024 * 1024)).toFixed(2)} MB
                </div>
              </div>
              {capture.notes && (
                <div className="metadata-item metadata-item-full">
                  <div className="metadata-label">Notes</div>
                  <div className="metadata-value">{capture.notes}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .lightbox-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .lightbox-container {
          position: relative;
          max-width: 1400px;
          max-height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .lightbox-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          color: white;
          font-size: 32px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 10;
          transition: background 0.2s;
        }

        .lightbox-close:hover {
          background: rgba(0, 0, 0, 0.7);
        }

        .lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.5);
          border: none;
          color: white;
          font-size: 32px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 10;
          transition: background 0.2s;
        }

        .lightbox-nav:hover {
          background: rgba(0, 0, 0, 0.7);
        }

        .lightbox-nav-prev {
          left: 16px;
        }

        .lightbox-nav-next {
          right: 16px;
        }

        .lightbox-image-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: auto;
          margin-bottom: 16px;
        }

        .lightbox-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .lightbox-no-image {
          color: white;
          text-align: center;
          font-size: 16px;
        }

        .lightbox-processing-badge {
          background: #fef3c7;
          color: #92400e;
          padding: 8px 16px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 16px;
          font-weight: 600;
        }

        .lightbox-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .lightbox-action-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-block;
        }

        .lightbox-action-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .lightbox-delete {
          background: rgba(220, 38, 38, 0.2);
          border-color: rgba(220, 38, 38, 0.5);
        }

        .lightbox-delete:hover {
          background: rgba(220, 38, 38, 0.3);
          border-color: rgba(220, 38, 38, 0.7);
        }

        .lightbox-metadata {
          background: rgba(0, 0, 0, 0.8);
          border-radius: 8px;
          padding: 24px;
          max-height: 300px;
          overflow-y: auto;
        }

        .metadata-title {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .metadata-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metadata-item-full {
          grid-column: 1 / -1;
        }

        .metadata-label {
          color: #9ca3af;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metadata-value {
          color: white;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .lightbox-nav {
            width: 40px;
            height: 40px;
            font-size: 24px;
          }

          .lightbox-close {
            width: 40px;
            height: 40px;
            font-size: 28px;
          }

          .metadata-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
