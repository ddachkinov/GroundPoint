===== BEGIN FILE: TASK_15_Layered_Overlay_Comparison.md =====

# TASK 15: Layered Overlay Comparison (Premium Feature)

## Purpose

Premium feature allowing users to overlay multiple images from the same angle with adjustable transparency to visualize subtle changes over time. Advanced visualization beyond side-by-side comparison.

## Priority

Medium. Premium tier differentiator (Professional tier and above).

## Dependencies

- TASK_06: Timeline and Calendar View.
- TASK_07: Side-by-Side Comparison.
- TASK_08: Subscription Billing (feature gating).
- Frontend canvas or image manipulation library (Fabric.js, Konva.js).

## Acceptance Criteria

1. Feature available only to Professional, Business, and Enterprise tier subscribers.
2. Users can select 2-4 images from same angle to overlay.
3. Images stacked with adjustable opacity per layer (0-100%).
4. Layer order adjustable (drag to reorder stack).
5. Toggle individual layers on/off.
6. Manual alignment tools: Arrow keys to nudge layers (1px increments).
7. Optional: Auto-alignment using feature detection (OpenCV or similar, computationally expensive).
8. Export layered view as single composite image (PNG with transparency preserved or flattened JPEG).
9. Overlay state shareable via URL.
10. Free tier users see upgrade prompt when attempting to access.

## UI Description

### Access Point

**Location:** Timeline page, after selecting 2-4 images.

**Button:** "Compare" dropdown menu:
- "Side-by-Side" (default, free).
- "Layered Overlay" (Premium badge).

**Interaction:**
- If Free tier user clicks "Layered Overlay", show upgrade modal: "This feature requires Professional plan or higher. [Upgrade]".
- If premium user, navigate to /overlay?ids=uuid1,uuid2,uuid3.

### Overlay Page Layout

**Header:**
- Title: "Layered Overlay - [Angle Name]".
- Close button (return to timeline).

**Main Canvas:**
- Large canvas area (full viewport minus controls).
- Stacked images rendered with opacity.
- Mouse interactions:
  - Drag to pan (all layers move together).
  - Mouse wheel to zoom (all layers).
  - Click to select layer (highlight border).

**Layer Control Panel (Right Sidebar):**

**Layer List:**
- Each layer card displays:
  - Thumbnail (50x50).
  - Date label.
  - Visibility toggle (eye icon, on/off).
  - Opacity slider (0-100%, default 100% for top, 50% for others).
  - Drag handle (reorder layers).
- Selected layer highlighted.

**Alignment Tools:**
- "Auto-Align" button (if enabled, computationally expensive).
- Manual nudge: Arrow buttons (Up, Down, Left, Right) to move selected layer 1px.
- Reset button: "Reset All Positions".

**Export Section:**
- "Export as PNG" button (preserves transparency).
- "Export as JPEG" button (flattens to single image).
- Resolution dropdown: 1080p, 4K, Original.

**Opacity Presets:**
- Quick buttons: "Equal Opacity" (all layers 50%), "Top Opaque" (top 100%, others 0%).

### Upgrade Prompt (Free Tier)

**Modal:**
- Title: "Unlock Layered Overlay".
- Message: "Overlay multiple images to see subtle changes over time. Available on Professional plan and above."
- Feature highlights:
  - Adjustable transparency.
  - Layer reordering.
  - Manual and auto-alignment.
- "Upgrade to Professional" button ($29/month).
- "Learn More" link to pricing page.

### Auto-Alignment (Optional Post-MVP)

**Flow:**
1. User clicks "Auto-Align".
2. Frontend shows loading spinner: "Aligning images... This may take 30 seconds."
3. Backend enqueues alignment job:
   - Download images from S3.
   - Use OpenCV or similar to detect features (SIFT, SURF).
   - Calculate transformation matrix (translation, rotation, scale).
   - Apply transformation to align images.
   - Return offset coordinates to frontend.
4. Frontend applies offsets to layers.

**Caveats:**
- Auto-alignment may fail if images too different (e.g., different time of day, construction progress changes scene drastically).
- Provide manual override if auto-alignment unsatisfactory.

## API Endpoints

### GET /api/v1/captures/overlay

**Query Parameters:**
- ids: Comma-separated capture UUIDs (2-4 IDs required).

**Response (200 OK):**
```
{
  "captures": [
    {
      "capture_id": "uuid1",
      "capture_date": "2025-01-05",
      "file_url": "https://cdn.../capture1.jpg",
      "image_width": 4000,
      "image_height": 3000
    },
    ...
  ],
  "subscription_tier": "Professional",
  "feature_enabled": true
}
```

**Validation:**
- All captures from same angle.
- User subscription tier Professional or higher.
- If Free tier, return `feature_enabled: false` with upgrade prompt.

### POST /api/v1/captures/align (Optional, post-MVP)

**Request Body:**
```
{
  "capture_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response (202 Accepted):**
```
{
  "job_id": "uuid",
  "status": "Processing",
  "estimated_time_seconds": 30
}
```

**Behavior:**
- Enqueue background job for image alignment.
- Return job ID for polling.

### GET /api/v1/jobs/:id (Alignment job status)

**Response (200 OK):**
```
{
  "job_id": "uuid",
  "status": "Completed",
  "result": {
    "alignments": [
      { "capture_id": "uuid1", "offset_x": 0, "offset_y": 0 },
      { "capture_id": "uuid2", "offset_x": -5, "offset_y": 3 },
      { "capture_id": "uuid3", "offset_x": 2, "offset_y": -7 }
    ]
  }
}
```

## Test Scenarios

### Test 1: Premium User Accesses Feature

**Steps:**
1. Professional tier user selects 3 images.
2. Clicks "Layered Overlay".

**Expected:** Navigates to overlay page, images stacked and rendered.

### Test 2: Free User Sees Upgrade Prompt

**Steps:**
1. Free tier user attempts to access layered overlay.

**Expected:** Upgrade modal displayed, access blocked.

### Test 3: Adjust Opacity

**Steps:**
1. Open layered overlay.
2. Adjust top layer opacity to 50%.
3. View result.

**Expected:** Top layer semi-transparent, layers beneath visible.

### Test 4: Reorder Layers

**Steps:**
1. Drag bottom layer to top.
2. View result.

**Expected:** Layer order changed, visual updates accordingly.

### Test 5: Toggle Layer Visibility

**Steps:**
1. Click eye icon to hide middle layer.

**Expected:** Layer hidden, only top and bottom visible.

### Test 6: Manual Nudge Alignment

**Steps:**
1. Select layer 2.
2. Click "Left" arrow button 5 times.
3. View result.

**Expected:** Layer 2 shifted 5px left, better aligned with layer 1.

### Test 7: Export as PNG

**Steps:**
1. Overlay 3 images with varying opacities.
2. Click "Export as PNG".

**Expected:** PNG file downloads with transparency preserved (if top layer <100%).

### Test 8: Export as JPEG

**Steps:**
1. Same setup.
2. Click "Export as JPEG".

**Expected:** JPEG file downloads, layers flattened (no transparency).

### Test 9: Reset Positions

**Steps:**
1. Manually nudge multiple layers.
2. Click "Reset All Positions".

**Expected:** All layers return to original positions (0,0 offset).

### Test 10: Auto-Align (if implemented)

**Steps:**
1. Overlay 3 images with slight misalignment.
2. Click "Auto-Align".
3. Wait for job to complete.

**Expected:** Layers automatically aligned, offsets applied.

### Test 11: Shareable URL

**Steps:**
1. Create overlay with specific opacity and layer settings.
2. Copy URL.
3. Open URL in new tab.

**Expected:** Overlay loads with same settings (ideally, but MVP may not persist opacity in URL).

### Test 12: Mobile View

**Steps:**
1. Open overlay on mobile device.

**Expected:** Layer controls accessible via bottom drawer, canvas responsive.

## Caveats and Edge Cases

### Performance with Large Images

Rendering multiple 4K images on canvas may cause performance issues. Consider downscaling images to max 2048px for overlay view.

### Browser Canvas Limits

Canvas size limited (e.g., 8192x8192 on Chrome). If images exceed, downscale before rendering.

### Different Aspect Ratios

If selected images have different aspect ratios (shouldn't happen if same angle, but possible), pad with transparent borders to match dimensions.

### Opacity Rendering

Use Canvas 2D API with `globalAlpha` for opacity. For better quality, consider WebGL renderer (more complex).

### Auto-Alignment Accuracy

Feature detection works best with high-contrast, static features (buildings, landmarks). May fail on featureless images (blue sky, flat surfaces).

### Layer Count Limit

Limit to 4 layers for performance. More layers increase canvas complexity and export file size.

### Export File Size

Exporting 4 layers at 4K resolution may produce large PNG (>20 MB). Warn user or compress output.

### Color Space Consistency

Ensure all images use same color space (sRGB) for accurate overlay rendering.

## Performance Considerations

### Canvas Rendering

Use `requestAnimationFrame` for smooth opacity slider updates. Debounce slider events (16ms / 60 FPS).

### Image Loading

Preload all images before enabling overlay controls. Display loading spinner while images load.

### Memory Management

Large images consume significant memory. Monitor browser memory usage. Release image data from memory when user navigates away (cleanup).

### Export Processing

Export to canvas, then to Blob, then download. For high-resolution exports, process in chunks to avoid memory overflow.

## Accessibility Checklist

- [ ] Layer controls keyboard accessible (Tab to navigate, arrow keys to adjust).
- [ ] Opacity sliders have aria-labels: "Layer 1 opacity: 50%".
- [ ] Visibility toggles announced: "Layer 1 visible" / "Layer 1 hidden".
- [ ] Canvas has text alternative: "Layered overlay of 3 captures from [dates]".
- [ ] Export buttons keyboard accessible.

## Security Checklist

- [ ] Feature gate enforced in API (subscription tier check).
- [ ] Authorization: User has access to all captures.
- [ ] Capture IDs validated.
- [ ] Canvas export does not leak user data (no cross-origin images).

===== END FILE: TASK_15_Layered_Overlay_Comparison.md =====
