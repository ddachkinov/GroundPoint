===== BEGIN FILE: TASK_07_Side_By_Side_Comparison.md =====

# TASK 07: Side-by-Side Image Comparison

## Purpose

Allow users to select 2-4 images from the same angle and view them side-by-side to visualize progress over time. Includes synchronized zoom/pan and export functionality.

## Priority

High. Key differentiator for construction progress visualization.

## Dependencies

- TASK_04: Image Upload Infrastructure.
- TASK_06: Timeline and Calendar View (selection mechanism).
- Frontend image viewer library (react-image-lightbox, react-zoom-pan-pinch, or custom).

## Acceptance Criteria

1. User can select 2-4 captures from timeline and click "Compare" button.
2. Selected captures must be from same angle (enforced in UI and API).
3. Comparison page displays images in grid layout: 2-way (1x2), 3-way (1x3 or triangle), 4-way (2x2).
4. Images scaled to equal dimensions (fit to viewport while maintaining aspect ratio).
5. Synchronized zoom: Zooming one image zooms all proportionally.
6. Synchronized pan: Panning one image pans all.
7. Date labels displayed below each image.
8. Export button generates single composite image (PNG) with all comparisons arranged.
9. Comparison state shareable via URL with capture IDs in query params.
10. Performance: Load 4 full-resolution images (20 MB each) in < 5 seconds on broadband.

## UI Description

### Comparison Page Layout

**Header:**
- Title: "Comparing [Angle Name] - [Site Name]".
- Layout toggle: 1x4 (horizontal) vs. 2x2 (grid) for 4-way comparison.
- Export button: "Export as PNG".
- Close button: Returns to timeline.

**Comparison Grid:**
- Layout based on count:
  - 2 images: 1x2 horizontal split.
  - 3 images: 1x3 horizontal or triangle (user preference).
  - 4 images: 2x2 grid (default) or 1x4 (toggle).
- Each image container:
  - Full-resolution image (loaded progressively: low-quality placeholder then full).
  - Date label overlay (bottom, semi-transparent background).
  - Zoom controls (+ / - buttons, reset button).
- Zoom level indicator: "150%" (shared across all images).

**Synchronized Controls:**
- Mouse wheel: Zoom in/out (all images).
- Click-drag: Pan image (all images follow).
- Pinch gesture (mobile): Zoom in/out.
- Double-click: Zoom to fit.

**Export Modal:**
- Preview of composite image.
- Layout options: Horizontal, Grid, Vertical.
- Resolution options: 1080p, 4K, Original (limited by browser canvas size).
- Download button.

### Shareable Link

**URL Format:**
```
/compare?ids=uuid1,uuid2,uuid3,uuid4&layout=grid
```

**Behavior:**
- Link copied to clipboard via "Share" button.
- Opening link loads comparison page with specified captures.
- Link valid as long as user has access to captures.

## API Endpoints

### GET /api/v1/captures/compare

**Query Parameters:**
- ids: Comma-separated capture UUIDs (2-4 IDs required).

**Response (200 OK):**
```
{
  "captures": [
    {
      "capture_id": "uuid1",
      "site_id": "uuid",
      "site_name": "North Facade",
      "angle_id": "uuid",
      "angle_name": "Ground Level",
      "capture_date": "2025-01-05",
      "file_url": "https://cdn.../capture1.jpg",
      "thumbnail_url": "https://cdn.../thumb1.jpg",
      "image_width": 4000,
      "image_height": 3000
    },
    {
      "capture_id": "uuid2",
      "angle_id": "uuid",
      "angle_name": "Ground Level",
      "capture_date": "2025-01-15",
      "file_url": "https://cdn.../capture2.jpg",
      ...
    }
  ]
}
```

**Validation:**
- All capture IDs must exist.
- User must have access to all captures.
- All captures must be from same angle (same angle_id).
- Number of IDs must be 2-4.

**Error Cases:**
- 400: "All captures must be from the same angle."
- 400: "Please select 2 to 4 captures for comparison."
- 403: "You do not have access to one or more selected captures."
- 404: "One or more captures not found."

## Test Scenarios

### Test 1: 2-Way Comparison

**Steps:**
1. Select 2 captures from same angle.
2. Click "Compare".
3. Verify images displayed side-by-side.

**Expected:** Both images visible, equal size, date labels shown.

### Test 2: 4-Way Comparison Grid Layout

**Steps:**
1. Select 4 captures from same angle.
2. Click "Compare".
3. Verify 2x2 grid layout.

**Expected:** 4 images in grid, all visible without scrolling (on desktop).

### Test 3: Synchronized Zoom

**Steps:**
1. Open 3-way comparison.
2. Zoom in on first image using mouse wheel.
3. Verify other images zoom proportionally.

**Expected:** All images zoom to same level.

### Test 4: Synchronized Pan

**Steps:**
1. Open 2-way comparison.
2. Zoom in to 200%.
3. Click-drag first image to pan.
4. Verify second image pans to same position.

**Expected:** Both images panned identically.

### Test 5: Export as PNG

**Steps:**
1. Open 4-way comparison.
2. Click "Export as PNG".
3. Select "Grid" layout, "1080p" resolution.
4. Click "Download".

**Expected:** PNG file downloaded with 2x2 grid of images, each labeled with date.

### Test 6: Shareable Link

**Steps:**
1. Open comparison.
2. Click "Share" button, copy link.
3. Open link in new browser/incognito window (logged in as same user).

**Expected:** Comparison loads with same captures.

### Test 7: Different Angles Error

**Steps:**
1. Select 2 captures from different angles.
2. Attempt to compare.

**Expected:** Error message "All captures must be from the same angle." Selection cleared or invalid captures deselected.

### Test 8: Insufficient Captures

**Steps:**
1. Select only 1 capture.
2. Attempt to compare.

**Expected:** "Compare" button disabled, tooltip: "Select 2-4 captures from the same angle."

### Test 9: Progressive Image Loading

**Steps:**
1. Open 4-way comparison (4 large images).
2. Observe loading.

**Expected:** Low-quality placeholders appear first, then full-resolution images load progressively.

### Test 10: Mobile Pinch Zoom

**Steps:**
1. Open comparison on mobile device.
2. Pinch to zoom.

**Expected:** All images zoom synchronously.

### Test 11: Layout Toggle

**Steps:**
1. Open 4-way comparison (default 2x2 grid).
2. Toggle to 1x4 horizontal layout.

**Expected:** Images rearranged horizontally, zoom/pan state preserved.

### Test 12: Reset Zoom

**Steps:**
1. Zoom in to 300%.
2. Click "Reset" button.

**Expected:** All images reset to fit viewport, zoom level 100%.

## Caveats and Edge Cases

### Different Image Aspect Ratios

If selected captures have different aspect ratios (e.g., 4:3 vs. 16:9), images scaled to fit common bounding box. Letterboxing (black bars) added if necessary to maintain aspect ratio.

### Very Large Images

Images >10,000px may exceed browser canvas size limits. Downscale to max 8192px before rendering.

### Memory Constraints

Loading 4 full-resolution images (20 MB each) may consume significant memory. Monitor browser memory usage. Consider loading medium-resolution versions first, full resolution on demand.

### Zoom Level Limits

Limit zoom: Min 50% (to prevent tiny images), Max 400% (to prevent excessive pixelation).

### Export Canvas Size Limits

Browser canvas size limited (e.g., 8192x8192 on Chrome). For "Original" resolution export, may need to downscale or use server-side rendering (post-MVP).

### Synchronization Edge Cases

If images have different aspect ratios, panning may not align perfectly (e.g., panning horizontally on 16:9 vs. 4:3). Adjust pan offsets proportionally.

### Shareable Link Expiration

If captures deleted or user loses access, shareable link returns error. Display friendly message: "One or more captures no longer available."

### Comparison Across Projects

Prevent comparison of captures from different projects (privacy concern). Enforce same project_id for all captures.

### Export File Size

High-resolution exports may produce large PNG files (>50 MB). Offer JPEG option for smaller file size.

### Browser Compatibility

Test synchronized zoom/pan on major browsers (Chrome, Firefox, Safari, Edge). Use polyfills for older browsers if needed.

## Performance Considerations

### Image Loading Strategy

Use progressive JPEG or WebP for faster initial display. Load full resolution on demand when user zooms.

### CDN for Images

Serve images via CDN with long TTL. Use HTTP/2 for parallel loading.

### Lazy Load Full Resolution

Load thumbnails first, replace with full resolution when comparison opens.

### Debounce Zoom/Pan Events

Debounce zoom and pan updates (e.g., 16ms / 60 FPS) to prevent excessive re-renders.

### Use requestAnimationFrame

For smooth pan/zoom animations, use requestAnimationFrame to batch DOM updates.

### Canvas Rendering for Export

Use HTML Canvas API for export. Render each image to canvas, then composite into single image.

### Web Workers for Export

Offload export processing to Web Worker to prevent UI blocking.

### Prefetch Comparison Images

When user selects captures on timeline, prefetch images in background to speed up comparison load.

## Accessibility Checklist

- [ ] Keyboard navigation: Tab to focus images, arrow keys to pan, +/- to zoom.
- [ ] Screen reader announces comparison mode: "Comparing 3 images from [angle] on [dates]."
- [ ] Alt text for images: "Capture from [date]".
- [ ] Focus indicator visible on active image.
- [ ] Zoom level announced: "Zoomed to 150%".
- [ ] Export modal keyboard accessible.

## Security Checklist

- [ ] Authorization: User has access to all captures before loading.
- [ ] Image URLs pre-signed (if private S3).
- [ ] Capture IDs validated (UUID format).
- [ ] No cross-project comparison allowed.
- [ ] Rate limiting on compare API (max 50 requests/minute).
- [ ] Shareable links do not expose sensitive data (only capture IDs).

===== END FILE: TASK_07_Side_By_Side_Comparison.md =====
