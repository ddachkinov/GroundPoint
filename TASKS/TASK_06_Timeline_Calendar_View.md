===== BEGIN FILE: TASK_06_Timeline_Calendar_View.md =====

# TASK 06: Timeline and Calendar View

## Purpose

Provide visual timeline interface for browsing captures chronologically. Users can quickly navigate by date, filter by site and angle, and select images for comparison.

## Priority

Critical. Core user experience for reviewing progress over time.

## Dependencies

- TASK_04: Image Upload Infrastructure.
- TASK_05: Thumbnail Generation.
- Frontend date picker and calendar component library.

## Acceptance Criteria

1. Timeline page displays captures for selected Project or Site.
2. Calendar grid shows months with dates containing captures highlighted.
3. Clicking date filters captures to that day.
4. Timeline slider allows scrubbing through time chronologically.
5. Filter dropdown for Site (if viewing Project) and Angle.
6. Thumbnail grid displays captures (default 4x4, responsive).
7. Thumbnails lazy-loaded as user scrolls.
8. Checkbox on thumbnails for selecting multiple for comparison.
9. Keyboard navigation: Arrow keys to navigate thumbnails, Space to select, Enter to open.
10. Pagination: 50 thumbnails per page.
11. Performance: Calendar query < 100ms, thumbnail grid load < 2s for 50 items.

## UI Description

### Timeline Page Layout

**Header:**
- Title: "[Project/Site Name] Timeline".
- Filter bar: Site dropdown (if project-level), Angle dropdown, date range picker.
- View toggle: Grid view (default) vs. List view.
- Selected count: "3 selected" with "Compare" button (appears when 2-4 selected).

**Calendar Section:**
- Month selector (previous/next buttons, month/year display).
- Calendar grid (7 columns for days of week, 5-6 rows).
- Dates with captures: Bold text with dot indicator.
- Current date: Highlighted border.
- Selected date: Filled background.

**Timeline Slider:**
- Horizontal slider below calendar.
- Markers for each capture date.
- Draggable handle to scrub through time.
- Date label follows handle.

**Thumbnail Grid:**
- Responsive grid: 1 column (mobile), 2 columns (tablet), 4 columns (desktop).
- Each thumbnail:
  - Image preview (400x300 or aspect ratio preserved).
  - Checkbox for selection (top-left corner).
  - Capture date label (bottom).
  - Angle badge (top-right).
  - Click to open lightbox view.
- Loading skeleton while thumbnails load.
- Infinite scroll or "Load More" button for pagination.

**Empty State:**
- If no captures for selected filters: "No captures found. Try adjusting filters or uploading images."

### Lightbox View

**Components:**
- Full-screen modal with image at original resolution.
- Navigation arrows (previous/next capture in timeline).
- Close button (X).
- Metadata panel (toggleable):
  - Capture date, angle, GPS, weather, notes.
  - Uploaded by, upload date.
  - File size, dimensions.
- Actions: Download, Delete, Add to comparison.
- Keyboard shortcuts: Arrow keys to navigate, Esc to close.

### List View

**Alternative to Grid:**
- Table with columns: Thumbnail (small), Date, Angle, Site, Uploader, File Size, Actions.
- Sortable columns (date, size).
- Checkbox column for selection.
- Row click opens lightbox.

## API Endpoints

### GET /api/v1/captures

**Query Parameters:**
- site_id: UUID (optional, if omitted and project_id provided, returns all captures in project).
- project_id: UUID (optional).
- angle_id: UUID (optional, filter by angle).
- date_from: YYYY-MM-DD (optional).
- date_to: YYYY-MM-DD (optional).
- limit: Integer, max 100, default 50.
- offset: Integer, default 0.
- sort: "date_asc" | "date_desc" (default "date_desc").

**Response (200 OK):**
```
{
  "captures": [
    {
      "capture_id": "uuid",
      "site_id": "uuid",
      "site_name": "North Facade",
      "angle_id": "uuid",
      "angle_name": "Ground Level",
      "capture_date": "2025-01-15",
      "thumbnail_url": "https://cdn.../thumb.jpg",
      "file_size": 5242880,
      "image_width": 4000,
      "image_height": 3000,
      "weather": "Sunny",
      "uploaded_by_user_name": "John Doe",
      "created_at": "2025-01-15T14:30:00Z"
    }
  ],
  "total": 127,
  "limit": 50,
  "offset": 0
}
```

**Performance:**
- Query optimized with indexes on site_id, angle_id, capture_date.
- Use database pagination (LIMIT/OFFSET).
- Cache thumbnail URLs via CDN (30-day TTL).

### GET /api/v1/captures/calendar

**Query Parameters:**
- site_id: UUID (optional).
- project_id: UUID (optional).
- angle_id: UUID (optional).
- month: YYYY-MM (optional, defaults to current month).

**Response (200 OK):**
```
{
  "month": "2025-01",
  "dates": [
    {
      "date": "2025-01-05",
      "count": 3
    },
    {
      "date": "2025-01-12",
      "count": 5
    }
  ]
}
```

**Behavior:**
- Return dates within specified month that have at least one capture matching filters.
- Include count of captures per date for display (e.g., "3 captures" tooltip).

**Performance:**
- Query: SELECT DISTINCT capture_date, COUNT(*) FROM captures WHERE ... GROUP BY capture_date.
- Index on (site_id, capture_date) or (project_id, capture_date).
- Cache result for 5 minutes.

## Test Scenarios

### Test 1: Load Timeline for Site

**Steps:**
1. Navigate to Site detail page, click Timeline tab.
2. Verify captures displayed in grid.
3. Verify calendar shows dates with captures.

**Expected:** Thumbnails load, calendar dates highlighted correctly.

### Test 2: Filter by Date

**Steps:**
1. Click date on calendar.
2. Verify thumbnail grid updates to show only captures from that date.

**Expected:** Only captures from selected date displayed.

### Test 3: Filter by Angle

**Steps:**
1. Select angle from dropdown.
2. Verify calendar and thumbnails update.

**Expected:** Only captures from selected angle displayed.

### Test 4: Timeline Slider

**Steps:**
1. Drag timeline slider handle.
2. Verify date label updates.
3. Release at specific date.

**Expected:** Thumbnail grid jumps to captures from that date.

### Test 5: Lazy Load Thumbnails

**Steps:**
1. Load timeline with 100 captures.
2. Scroll down.
3. Verify additional thumbnails load as user scrolls.

**Expected:** Thumbnails beyond initial 50 load on demand.

### Test 6: Select Multiple Captures

**Steps:**
1. Click checkboxes on 3 thumbnails.
2. Verify "3 selected" indicator appears.
3. Click "Compare" button.

**Expected:** Navigate to comparison page with selected captures.

### Test 7: Keyboard Navigation

**Steps:**
1. Focus on first thumbnail.
2. Press arrow keys to navigate.
3. Press Space to select.
4. Press Enter to open lightbox.

**Expected:** Keyboard controls work as expected.

### Test 8: Lightbox Navigation

**Steps:**
1. Click thumbnail to open lightbox.
2. Click next arrow to navigate to next capture.
3. Click metadata toggle to show details.

**Expected:** Lightbox displays full image, metadata, navigation works.

### Test 9: Empty State

**Steps:**
1. Create site with no captures.
2. Open timeline.

**Expected:** Display "No captures found. Upload images to get started."

### Test 10: Pagination

**Steps:**
1. Load timeline with 100 captures.
2. Verify "Load More" button appears after 50th thumbnail.
3. Click "Load More".

**Expected:** Next 50 thumbnails load, button disappears if no more.

### Test 11: List View

**Steps:**
1. Toggle to List view.
2. Verify captures displayed in table format.
3. Click column header to sort.

**Expected:** Table view functional, sorting works.

### Test 12: Calendar Performance

**Steps:**
1. Load calendar for project with 10,000 captures.
2. Measure query time.

**Expected:** Calendar query completes in < 100ms.

## Caveats and Edge Cases

### No Captures for Selected Date

If user clicks date with captures but filters by angle with no captures on that date, display empty state with message "No captures for [angle] on [date]. Try a different date or angle."

### Large Date Ranges

If user selects date range spanning years, limit query to prevent performance issues. Cap at 365 days or implement server-side pagination for date ranges.

### Timezone Handling

Capture dates stored in UTC or operator's timezone. Display dates in user's local timezone with clear indication (e.g., "Jan 15, 2025 (PST)").

### Thumbnail Load Failures

If thumbnail fails to load (404, 403), display placeholder with "Image unavailable" and retry button.

### Calendar Month Navigation

When navigating months, maintain selected angle and site filters.

### Mobile Responsiveness

On mobile, calendar may be cramped. Consider collapsing to date picker dropdown instead of full grid.

### Comparing Captures from Different Angles

Prevent selection of captures from different angles for comparison (validation in UI and API). Display error: "Please select captures from the same angle."

### Infinite Scroll vs Load More

Infinite scroll better UX but can cause performance issues with many captures. Implement load more button for MVP, infinite scroll post-MVP.

### Calendar Cache Invalidation

Invalidate calendar cache when new capture uploaded to ensure dates update immediately.

### Thumbnail Loading State

Display skeleton loader for thumbnails while loading to improve perceived performance.

## Performance Considerations

### Database Query Optimization

Indexes:
- (site_id, capture_date DESC).
- (angle_id, capture_date DESC).
- (project_id, capture_date DESC) for project-level timeline.

Use EXPLAIN ANALYZE to verify query plans.

### Thumbnail CDN

Serve thumbnails via CDN with 30-day cache TTL. Use Cache-Control headers.

### Frontend Caching

Cache fetched thumbnails in React state or context to avoid re-fetching when navigating back.

### Lazy Loading

Use Intersection Observer API for lazy loading thumbnails. Load thumbnails only when entering viewport.

### Virtual Scrolling

For very long lists (>500 captures), consider virtual scrolling (react-window, react-virtualized) to render only visible items.

### Image Compression

Ensure thumbnails compressed (JPEG quality 85) to minimize bandwidth.

### API Response Payload

Minimize response size: Return only necessary fields (exclude verbose notes, full file paths).

### Concurrent Requests

Limit concurrent thumbnail requests in browser (max 6 per domain). Queue additional requests.

## Accessibility Checklist

- [ ] Calendar dates keyboard navigable (arrow keys).
- [ ] Thumbnail checkboxes labeled (aria-label).
- [ ] Lightbox keyboard navigable (arrows, Esc).
- [ ] Focus trap in lightbox (Tab cycles within modal).
- [ ] Skip link to bypass calendar and jump to thumbnails.
- [ ] Alternative text for thumbnails (date + angle name).
- [ ] Screen reader announces selected count and comparison button.
- [ ] Date picker accessible (keyboard and screen reader compatible).

## Security Checklist

- [ ] Authorization: User has access to project/site before loading timeline.
- [ ] Thumbnail URLs pre-signed (if private S3 bucket).
- [ ] API pagination limits enforced (max 100 per request).
- [ ] SQL injection prevented via ORM.
- [ ] Rate limiting on API endpoints (max 100 requests/minute).

===== END FILE: TASK_06_Timeline_Calendar_View.md =====
