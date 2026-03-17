// @ts-nocheck
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { capturesAPI, Capture } from '../api/captures';

type Layout = 'horizontal' | 'grid' | 'vertical';

/**
 * Comparison page for viewing 2-4 captures side-by-side
 */
export default function ComparisonPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [captures, setCaptures] = useState<Capture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout>('grid');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Get IDs from URL
  const idsParam = searchParams.get('ids');
  const layoutParam = searchParams.get('layout') as Layout | null;

  useEffect(() => {
    if (layoutParam) {
      setLayout(layoutParam);
    }
  }, [layoutParam]);

  // Load captures
  useEffect(() => {
    const loadCaptures = async () => {
      if (!idsParam) {
        setError('No captures selected for comparison');
        setIsLoading(false);
        return;
      }

      const ids = idsParam.split(',');
      if (ids.length < 2 || ids.length > 4) {
        setError('Please select 2-4 captures for comparison');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await capturesAPI.getComparison(ids);
        setCaptures(data.captures);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load comparison');
      } finally {
        setIsLoading(false);
      }
    };

    loadCaptures();
  }, [idsParam]);

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Export as PNG
  const handleExport = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = layout === 'horizontal' || layout === 'vertical' ? 1 : 2;
    const rows = layout === 'horizontal' ? 1 : layout === 'vertical' ? captures.length : 2;

    canvas.width = cols * 1920;
    canvas.height = rows * 1080;

    // Load and draw images
    for (let i = 0; i < captures.length; i++) {
      if (!captures[i].file_url) continue;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = captures[i].file_url!;
      });

      const col = layout === 'horizontal' || layout === 'vertical' ? 0 : i % 2;
      const row = layout === 'horizontal' ? 0 : layout === 'vertical' ? i : Math.floor(i / 2);

      ctx.drawImage(img, col * 1920, row * 1080, 1920, 1080);

      // Add date label
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(col * 1920, row * 1080 + 1020, 1920, 60);
      ctx.fillStyle = 'white';
      ctx.font = '32px sans-serif';
      ctx.fillText(
        new Date(captures[i].capture_date).toLocaleDateString(),
        col * 1920 + 20,
        row * 1080 + 1060
      );
    }

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comparison-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // Copy share link
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  // Get grid class
  const getGridClass = () => {
    if (captures.length === 2) return layout === 'vertical' ? 'grid-1x2-vertical' : 'grid-1x2';
    if (captures.length === 3) return 'grid-1x3';
    return layout === 'horizontal' ? 'grid-1x4' : 'grid-2x2';
  };

  if (isLoading) {
    return (
      <div className="comparison-loading">
        <div>Loading comparison...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comparison-error">
        <div className="error-content">
          <h2>Unable to load comparison</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/timeline')} className="back-button">
            Back to Timeline
          </button>
        </div>
      </div>
    );
  }

  if (captures.length === 0) {
    return null;
  }

  const angleName = captures[0]?.angle_name;
  const siteName = captures[0]?.site_name;

  return (
    <div className="comparison-page">
      {/* Header */}
      <div className="comparison-header">
        <div className="header-left">
          <button onClick={() => navigate('/timeline')} className="close-button">
            ← Back
          </button>
          <h1 className="comparison-title">
            Comparing {angleName} - {siteName}
          </h1>
        </div>

        <div className="header-controls">
          {/* Zoom controls */}
          <div className="zoom-controls">
            <button onClick={handleZoomOut} disabled={zoom <= 0.5}>
              −
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} disabled={zoom >= 4}>
              +
            </button>
            <button onClick={handleResetZoom}>Reset</button>
          </div>

          {/* Layout toggle for 4 images */}
          {captures.length === 4 && (
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as Layout)}
              className="layout-select"
            >
              <option value="grid">2×2 Grid</option>
              <option value="horizontal">1×4 Horizontal</option>
            </select>
          )}

          <button onClick={handleExport} className="export-button">
            Export as PNG
          </button>
          <button onClick={handleShare} className="share-button">
            Share
          </button>
        </div>
      </div>

      {/* Comparison grid */}
      <div
        className={`comparison-grid ${getGridClass()}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {captures.map((capture, index) => (
          <div
            key={capture.capture_id}
            className="image-container"
            ref={(el) => (containerRefs.current[index] = el)}
          >
            <div
              className="image-wrapper"
              style={{
                transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              }}
            >
              {capture.file_url ? (
                <img
                  src={capture.file_url}
                  alt={`${capture.angle_name} - ${new Date(capture.capture_date).toLocaleDateString()}`}
                  className="comparison-image"
                  draggable={false}
                />
              ) : (
                <div className="no-image">Image not available</div>
              )}
            </div>
            <div className="image-label">
              {new Date(capture.capture_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .comparison-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #1a1a1a;
          display: flex;
          flex-direction: column;
        }

        .comparison-loading,
        .comparison-error {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          color: white;
        }

        .error-content {
          text-align: center;
          padding: 32px;
        }

        .error-content h2 {
          margin-bottom: 16px;
          color: #f87171;
        }

        .back-button {
          margin-top: 16px;
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .comparison-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background: rgba(0, 0, 0, 0.8);
          border-bottom: 1px solid #333;
          gap: 16px;
          flex-wrap: wrap;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .close-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .comparison-title {
          font-size: 18px;
          font-weight: 600;
          color: white;
          margin: 0;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          padding: 6px 12px;
          border-radius: 6px;
        }

        .zoom-controls button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 18px;
        }

        .zoom-controls button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }

        .zoom-controls button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .zoom-level {
          color: white;
          font-size: 14px;
          min-width: 50px;
          text-align: center;
        }

        .layout-select,
        .export-button,
        .share-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .layout-select:hover,
        .export-button:hover,
        .share-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .comparison-grid {
          flex: 1;
          display: grid;
          gap: 8px;
          padding: 8px;
          overflow: hidden;
        }

        .grid-1x2 {
          grid-template-columns: repeat(2, 1fr);
        }

        .grid-1x2-vertical {
          grid-template-rows: repeat(2, 1fr);
        }

        .grid-1x3 {
          grid-template-columns: repeat(3, 1fr);
        }

        .grid-2x2 {
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, 1fr);
        }

        .grid-1x4 {
          grid-template-columns: repeat(4, 1fr);
        }

        .image-container {
          position: relative;
          background: #000;
          overflow: hidden;
          border-radius: 4px;
        }

        .image-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s ease-out;
        }

        .comparison-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          user-select: none;
        }

        .no-image {
          color: #666;
          font-size: 14px;
        }

        .image-label {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 12px;
          text-align: center;
          font-size: 14px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .comparison-title {
            font-size: 16px;
          }

          .header-controls {
            flex-wrap: wrap;
          }

          .grid-1x4 {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 1fr);
          }

          .grid-1x3 {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
