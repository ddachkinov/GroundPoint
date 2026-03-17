// @ts-nocheck
import React from 'react';
import { CalendarDate } from '../../api/captures';

interface CalendarProps {
  month: string; // YYYY-MM format
  dates: CalendarDate[];
  selectedDate: string | null; // YYYY-MM-DD format
  onDateSelect: (date: string) => void;
  onMonthChange: (month: string) => void;
}

/**
 * Calendar component for browsing captures by date
 */
export function Calendar({ month, dates, selectedDate, onDateSelect, onMonthChange }: CalendarProps) {
  const [year, monthNum] = month.split('-').map(Number);

  // Get first day of month and total days
  const firstDay = new Date(year, monthNum - 1, 1);
  const lastDay = new Date(year, monthNum, 0);
  const totalDays = lastDay.getDate();
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Create map of dates with captures for quick lookup
  const datesWithCaptures = new Map(dates.map((d) => [d.date, d.count]));

  // Generate calendar grid
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = new Array(firstDayOfWeek).fill(null);

  for (let day = 1; day <= totalDays; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  // Navigate to previous month
  const handlePreviousMonth = () => {
    const date = new Date(year, monthNum - 2, 1); // -2 because monthNum is 1-indexed
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(newMonth);
  };

  // Navigate to next month
  const handleNextMonth = () => {
    const date = new Date(year, monthNum, 1); // monthNum is already 1-indexed
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(newMonth);
  };

  // Format date as YYYY-MM-DD
  const formatDate = (day: number): string => {
    return `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Check if date is today
  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      monthNum === today.getMonth() + 1 &&
      year === today.getFullYear()
    );
  };

  // Get month name
  const monthName = new Date(year, monthNum - 1, 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="calendar">
      {/* Header */}
      <div className="calendar-header">
        <button onClick={handlePreviousMonth} className="calendar-nav-button" aria-label="Previous month">
          ←
        </button>
        <div className="calendar-title">
          {monthName} {year}
        </div>
        <button onClick={handleNextMonth} className="calendar-nav-button" aria-label="Next month">
          →
        </button>
      </div>

      {/* Weekday headers */}
      <div className="calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="calendar-week">
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <div key={dayIndex} className="calendar-day-empty" />;
              }

              const dateStr = formatDate(day);
              const count = datesWithCaptures.get(dateStr);
              const hasCaptures = count !== undefined;
              const isSelected = selectedDate === dateStr;
              const isTodayDate = isToday(day);

              return (
                <button
                  key={dayIndex}
                  className={`calendar-day ${hasCaptures ? 'has-captures' : ''} ${
                    isSelected ? 'selected' : ''
                  } ${isTodayDate ? 'today' : ''}`}
                  onClick={() => hasCaptures && onDateSelect(dateStr)}
                  disabled={!hasCaptures}
                  title={hasCaptures ? `${count} capture${count !== 1 ? 's' : ''}` : undefined}
                  aria-label={`${monthName} ${day}${hasCaptures ? `, ${count} captures` : ''}`}
                >
                  <span className="calendar-day-number">{day}</span>
                  {hasCaptures && <span className="calendar-day-indicator" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <style jsx>{`
        .calendar {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .calendar-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }

        .calendar-nav-button {
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          width: 32px;
          height: 32px;
          cursor: pointer;
          font-size: 16px;
          color: #6b7280;
          transition: all 0.2s;
        }

        .calendar-nav-button:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 8px;
        }

        .calendar-weekday {
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          padding: 8px 0;
        }

        .calendar-grid {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .calendar-week {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        .calendar-day-empty {
          height: 40px;
        }

        .calendar-day {
          position: relative;
          height: 40px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-size: 14px;
          color: #6b7280;
        }

        .calendar-day:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .calendar-day:not(:disabled):hover {
          background: #f9fafb;
          border-color: #3b82f6;
        }

        .calendar-day.has-captures {
          font-weight: 600;
          color: #111827;
        }

        .calendar-day.today {
          border-color: #3b82f6;
          border-width: 2px;
        }

        .calendar-day.selected {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .calendar-day.selected:hover {
          background: #2563eb;
        }

        .calendar-day-number {
          position: relative;
          z-index: 1;
        }

        .calendar-day-indicator {
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          background: #3b82f6;
          border-radius: 50%;
        }

        .calendar-day.selected .calendar-day-indicator {
          background: white;
        }
      `}</style>
    </div>
  );
}
