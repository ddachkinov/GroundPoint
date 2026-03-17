// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCapturesStore } from '../store/capturesStore';
import { useProjectsStore } from '../store/projectsStore';
import { Calendar } from '../components/timeline/Calendar';
import { ThumbnailGrid } from '../components/timeline/ThumbnailGrid';
import { ImageLightbox } from '../components/timeline/ImageLightbox';
import { Capture } from '../api/captures';

/**
 * Timeline page for browsing captures chronologically
 */
export default function TimelinePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get IDs from URL params
  const projectId = searchParams.get('project_id');
  const siteId = searchParams.get('site_id');
  const angleId = searchParams.get('angle_id');
  const date = searchParams.get('date');

  // Local state
  const [selectedDate, setSelectedDate] = useState<string | null>(date);
  const [currentMonth, setCurrentMonth] = useState(
    date ? date.slice(0, 7) : new Date().toISOString().slice(0, 7)
  );
  const [lightboxCapture, setLightboxCapture] = useState<Capture | null>(null);

  // Stores
  const {
    captures,
    calendarDates,
    calendarMonth,
    isLoadingCalendar,
    isLoading,
    selectedCaptureIds,
    total,
    limit,
    offset,
    getCalendarData,
    listCaptures,
    deleteCapture,
    toggleCaptureSelection,
    clearSelection,
  } = useCapturesStore();

  const { projects, sites, listProjects, listSites } = useProjectsStore();

  // Load projects on mount
  useEffect(() => {
    if (projects.length === 0) {
      listProjects();
    }
  }, []);

  // Load sites when project changes
  useEffect(() => {
    if (projectId && projects.length > 0) {
      listSites(projectId);
    }
  }, [projectId, projects.length]);

  // Load calendar data when filters change
  useEffect(() => {
    const query: any = { month: currentMonth };
    if (siteId) query.site_id = siteId;
    else if (projectId) query.project_id = projectId;
    if (angleId) query.angle_id = angleId;

    getCalendarData(query);
  }, [currentMonth, siteId, projectId, angleId]);

  // Load captures when filters or date changes
  useEffect(() => {
    const query: any = { limit: 50, offset: 0, sort: 'date_desc' };
    if (siteId) query.site_id = siteId;
    else if (projectId) query.project_id = projectId;
    if (angleId) query.angle_id = angleId;
    if (selectedDate) {
      query.start_date = selectedDate;
      query.end_date = selectedDate;
    }

    listCaptures(query);
  }, [siteId, projectId, angleId, selectedDate]);

  // Handle date selection from calendar
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('date', date);
    setSearchParams(newParams);
  };

  // Handle month change in calendar
  const handleMonthChange = (month: string) => {
    setCurrentMonth(month);
  };

  // Handle load more
  const handleLoadMore = () => {
    const query: any = { limit: 50, offset: offset + limit, sort: 'date_desc' };
    if (siteId) query.site_id = siteId;
    else if (projectId) query.project_id = projectId;
    if (angleId) query.angle_id = angleId;
    if (selectedDate) {
      query.start_date = selectedDate;
      query.end_date = selectedDate;
    }

    listCaptures(query);
  };

  // Handle capture click (open lightbox)
  const handleCaptureClick = (capture: Capture) => {
    setLightboxCapture(capture);
  };

  // Handle lightbox navigation
  const handleLightboxNext = () => {
    if (!lightboxCapture) return;
    const currentIndex = captures.findIndex((c) => c.capture_id === lightboxCapture.capture_id);
    if (currentIndex < captures.length - 1) {
      setLightboxCapture(captures[currentIndex + 1]);
    }
  };

  const handleLightboxPrevious = () => {
    if (!lightboxCapture) return;
    const currentIndex = captures.findIndex((c) => c.capture_id === lightboxCapture.capture_id);
    if (currentIndex > 0) {
      setLightboxCapture(captures[currentIndex - 1]);
    }
  };

  // Handle delete from lightbox
  const handleDelete = async () => {
    if (!lightboxCapture) return;
    if (confirm('Are you sure you want to delete this capture?')) {
      await deleteCapture(lightboxCapture.capture_id);
      setLightboxCapture(null);
    }
  };

  // Handle filter changes
  const handleProjectChange = (newProjectId: string) => {
    const newParams = new URLSearchParams();
    if (newProjectId) newParams.set('project_id', newProjectId);
    setSearchParams(newParams);
    setSelectedDate(null);
  };

  const handleSiteChange = (newSiteId: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (newSiteId) {
      newParams.set('site_id', newSiteId);
    } else {
      newParams.delete('site_id');
    }
    newParams.delete('angle_id');
    newParams.delete('date');
    setSearchParams(newParams);
    setSelectedDate(null);
  };

  const handleAngleChange = (newAngleId: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (newAngleId) {
      newParams.set('angle_id', newAngleId);
    } else {
      newParams.delete('angle_id');
    }
    setSearchParams(newParams);
  };

  // Clear date filter
  const handleClearDate = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('date');
    setSearchParams(newParams);
    setSelectedDate(null);
  };

  // Handle compare button click
  const handleCompare = () => {
    if (selectedCaptureIds.length >= 2 && selectedCaptureIds.length <= 4) {
      navigate(`/compare?ids=${selectedCaptureIds.join(',')}`);
    }
  };

  // Get available angles for selected site
  const { angles, listAngles } = useCapturesStore();
  useEffect(() => {
    if (siteId) {
      listAngles(siteId);
    }
  }, [siteId]);

  // Get title based on selection
  const getPageTitle = () => {
    const project = projects.find((p) => p.project_id === projectId);
    const site = sites.find((s) => s.site_id === siteId);

    if (site) return `${site.name} Timeline`;
    if (project) return `${project.name} Timeline`;
    return 'Timeline';
  };

  const hasMore = offset + limit < total;

  return (
    <div className="timeline-page">
      {/* Header */}
      <div className="timeline-header">
        <div className="timeline-title-section">
          <h1 className="timeline-title">{getPageTitle()}</h1>
          {selectedDate && (
            <div className="timeline-date-badge">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              <button onClick={handleClearDate} className="clear-date-button">
                ×
              </button>
            </div>
          )}
        </div>

        {/* Selected captures indicator */}
        {selectedCaptureIds.length > 0 && (
          <div className="selected-indicator">
            <span>{selectedCaptureIds.length} selected</span>
            {selectedCaptureIds.length >= 2 && selectedCaptureIds.length <= 4 && (
              <button className="compare-button" onClick={handleCompare}>
                Compare
              </button>
            )}
            <button className="clear-selection-button" onClick={clearSelection}>
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="timeline-filters">
        <div className="filter-group">
          <label htmlFor="project-select">Project</label>
          <select
            id="project-select"
            value={projectId || ''}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="filter-select"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {projectId && (
          <div className="filter-group">
            <label htmlFor="site-select">Site</label>
            <select
              id="site-select"
              value={siteId || ''}
              onChange={(e) => handleSiteChange(e.target.value)}
              className="filter-select"
            >
              <option value="">All Sites</option>
              {sites.map((site) => (
                <option key={site.site_id} value={site.site_id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {siteId && angles.length > 0 && (
          <div className="filter-group">
            <label htmlFor="angle-select">Angle</label>
            <select
              id="angle-select"
              value={angleId || ''}
              onChange={(e) => handleAngleChange(e.target.value)}
              className="filter-select"
            >
              <option value="">All Angles</option>
              {angles.map((angle) => (
                <option key={angle.id} value={angle.id}>
                  {angle.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="timeline-content">
        {/* Calendar */}
        <div className="timeline-calendar">
          <Calendar
            month={currentMonth}
            dates={calendarDates}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
          />
        </div>

        {/* Thumbnail grid */}
        <div className="timeline-grid">
          <ThumbnailGrid
            captures={captures}
            selectedCaptureIds={selectedCaptureIds}
            onCaptureClick={handleCaptureClick}
            onCaptureSelect={toggleCaptureSelection}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Lightbox */}
      <ImageLightbox
        capture={lightboxCapture}
        onClose={() => setLightboxCapture(null)}
        onNext={handleLightboxNext}
        onPrevious={handleLightboxPrevious}
        onDelete={handleDelete}
        onAddToComparison={() => {
          if (lightboxCapture) {
            toggleCaptureSelection(lightboxCapture.capture_id);
          }
        }}
      />

      <style jsx>{`
        .timeline-page {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .timeline-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .timeline-title-section {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .timeline-title {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }

        .timeline-date-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #dbeafe;
          color: #1e40af;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
        }

        .clear-date-button {
          background: none;
          border: none;
          color: #1e40af;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clear-date-button:hover {
          opacity: 0.7;
        }

        .selected-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f3f4f6;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #111827;
        }

        .compare-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .compare-button:hover {
          background: #2563eb;
        }

        .clear-selection-button {
          background: none;
          border: 1px solid #d1d5db;
          color: #6b7280;
          padding: 6px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .clear-selection-button:hover {
          background: #f9fafb;
        }

        .timeline-filters {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 200px;
        }

        .filter-group label {
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
        }

        .filter-select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .timeline-content {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .timeline-content {
            grid-template-columns: 1fr;
          }
        }

        .timeline-calendar {
          position: sticky;
          top: 24px;
          align-self: start;
        }

        @media (max-width: 1024px) {
          .timeline-calendar {
            position: relative;
            top: 0;
          }
        }

        .timeline-grid {
          min-height: 400px;
        }

        @media (max-width: 768px) {
          .timeline-page {
            padding: 16px;
          }

          .timeline-title {
            font-size: 24px;
          }

          .filter-group {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
