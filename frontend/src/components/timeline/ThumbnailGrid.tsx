// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Capture, ProcessingStatus } from '../../api/captures';

interface ThumbnailGridProps {
  captures: Capture[];
  selectedCaptureIds: string[];
  onCaptureClick: (capture: Capture) => void;
  onCaptureSelect: (captureId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

/**
 * Thumbnail grid component with lazy loading and selection
 */
export function ThumbnailGrid({
  captures,
  selectedCaptureIds,
  onCaptureClick,
  onCaptureSelect,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: ThumbnailGridProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer for load more
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, onLoadMore, isLoading]);

  const handleImageLoad = (captureId: string) => {
    setLoadedImages((prev) => new Set([...prev, captureId]));
  };

  const getStatusBadge = (status: ProcessingStatus) => {
    switch (status) {
      case 'PROCESSING':
        return { text: 'Processing...', className: 'status-processing' };
      case 'FAILED':
        return { text: 'Failed', className: 'status-failed' };
      case 'UPLOADED':
        return { text: 'Uploading...', className: 'status-uploading' };
      default:
        return null;
    }
  };

  if (captures.length === 0 && !isLoading) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📷</div>
        <div className="empty-title">No captures found</div>
        <div className="empty-description">Try adjusting filters or uploading images.</div>

        <style jsx>{`
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 64px 16px;
            text-align: center;
          }

          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.5;
          }

          .empty-title {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 8px;
          }

          .empty-description {
            font-size: 14px;
            color: #6b7280;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="thumbnail-grid-container">
      <div className="thumbnail-grid">
        {captures.map((capture) => {
          const isSelected = selectedCaptureIds.includes(capture.capture_id);
          const isLoaded = loadedImages.has(capture.capture_id);
          const statusBadge = getStatusBadge(capture.processing_status);

          return (
            <div key={capture.capture_id} className="thumbnail-item">
              {/* Selection checkbox */}
              <div className="thumbnail-checkbox">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onCaptureSelect(capture.capture_id);
                  }}
                  aria-label={`Select ${capture.angle_name} from ${capture.capture_date}`}
                />
              </div>

              {/* Thumbnail image */}
              <div
                className="thumbnail-image-container"
                onClick={() => onCaptureClick(capture)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onCaptureClick(capture);
                  }
                }}
              >
                {!isLoaded && (
                  <div className="thumbnail-skeleton">
                    <div className="skeleton-shimmer" />
                  </div>
                )}
                {capture.thumbnail_url ? (
                  <img
                    src={capture.thumbnail_url}
                    alt={`${capture.angle_name} - ${capture.capture_date}`}
                    className="thumbnail-image"
                    loading="lazy"
                    onLoad={() => handleImageLoad(capture.capture_id)}
                    style={{ display: isLoaded ? 'block' : 'none' }}
                  />
                ) : (
                  <div className="thumbnail-placeholder">
                    <span>No image</span>
                  </div>
                )}

                {/* Angle badge */}
                <div className="thumbnail-angle-badge">{capture.angle_name}</div>

                {/* Processing status badge */}
                {statusBadge && (
                  <div className={`thumbnail-status-badge ${statusBadge.className}`}>
                    {statusBadge.text}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="thumbnail-metadata">
                <div className="thumbnail-date">
                  {new Date(capture.capture_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="thumbnail-site">{capture.site_name}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="load-more-trigger">
          {isLoading && <div className="load-more-spinner">Loading...</div>}
        </div>
      )}

      <style jsx>{`
        .thumbnail-grid-container {
          width: 100%;
        }

        .thumbnail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }

        @media (max-width: 768px) {
          .thumbnail-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 12px;
          }
        }

        @media (max-width: 480px) {
          .thumbnail-grid {
            grid-template-columns: 1fr;
          }
        }

        .thumbnail-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s;
        }

        .thumbnail-item:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .thumbnail-checkbox {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 10;
        }

        .thumbnail-checkbox input[type='checkbox'] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .thumbnail-image-container {
          position: relative;
          width: 100%;
          padding-top: 75%; /* 4:3 aspect ratio */
          background: #f3f4f6;
          cursor: pointer;
          overflow: hidden;
        }

        .thumbnail-skeleton {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .thumbnail-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumbnail-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          color: #9ca3af;
          font-size: 14px;
        }

        .thumbnail-angle-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .thumbnail-status-badge {
          position: absolute;
          bottom: 8px;
          left: 8px;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-processing {
          background: #fef3c7;
          color: #92400e;
        }

        .status-failed {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-uploading {
          background: #dbeafe;
          color: #1e40af;
        }

        .thumbnail-metadata {
          padding: 12px;
        }

        .thumbnail-date {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .thumbnail-site {
          font-size: 12px;
          color: #6b7280;
        }

        .load-more-trigger {
          padding: 32px;
          text-align: center;
        }

        .load-more-spinner {
          color: #6b7280;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
