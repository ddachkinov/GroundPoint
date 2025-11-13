===== BEGIN FILE: TASK_16_Video_Upload_Premium.md =====

# TASK 16: Video Upload and Playback (Premium Feature)

## Purpose

Premium feature allowing Business and Enterprise tier subscribers to upload video walkthroughs of construction sites. Videos transcoded to multiple resolutions for adaptive streaming.

## Priority

Medium. Premium tier differentiator (Business tier and above).

## Dependencies

- TASK_04: Image Upload Infrastructure (reuse pre-signed URL flow).
- TASK_08: Subscription Billing (feature gating).
- Video transcoding service (AWS MediaConvert, Mux, Coconut, or FFmpeg).
- Video player library (Video.js, Plyr, or similar with HLS support).

## Acceptance Criteria

1. Feature available only to Business and Enterprise tier subscribers.
2. Users can upload video files (MP4, MOV formats).
3. File size limits: Business tier 500 MB, Enterprise tier 2 GB.
4. Videos transcoded to multiple resolutions: 1080p, 720p, 480p (adaptive streaming).
5. HLS or DASH manifest generated for browser playback.
6. Video thumbnail generated from 5-second mark.
7. Video player with playback controls (play, pause, seek, fullscreen, quality selector).
8. Videos associated with Site and Angle (like images).
9. Videos displayed in timeline alongside images.
10. Video storage counted against subscription quota (Business: 100 GB, Enterprise: unlimited).

## UI Description

### Upload Button (Site Timeline)

**Location:** Same as image upload, but with "Upload Video" option in dropdown.

**Button:** "Upload" dropdown:
- "Upload Images" (default).
- "Upload Video" (Premium badge, disabled for Free/Professional tiers).

**Interaction:**
- If Business/Enterprise tier, open video upload modal.
- If Free/Professional tier, show upgrade prompt.

### Video Upload Modal

**Components:**

**File Picker:**
- "Select Video File" button or drag-and-drop area.
- Supported formats: MP4, MOV.
- Max file size displayed: "Max 500 MB" (Business) or "Max 2 GB" (Enterprise).

**Metadata Form:**
- Capture Date (date picker).
- Angle (dropdown).
- GPS Coordinates (optional, auto-populate from EXIF if available).
- Notes (textarea, max 500 chars).

**Upload Progress:**
- Progress bar with percentage (0-100%).
- Estimated time remaining.
- "Cancel" button.

**Post-Upload Processing:**
- After upload completes, show: "Video uploaded. Processing... This may take 5-10 minutes."
- User can close modal and continue working (background processing).

### Video Player (Timeline Detail View)

**Components:**

**Player UI:**
- Video player with standard controls:
  - Play/Pause button.
  - Timeline scrubber.
  - Volume control.
  - Quality selector (Auto, 1080p, 720p, 480p).
  - Fullscreen button.
  - Playback speed (0.5x, 1x, 1.5x, 2x).

**Metadata Panel (below player):**
- Capture date, angle, notes.
- Uploaded by, upload date.
- Video duration, file size.
- Download button (original quality).

**Thumbnail Display (Timeline Grid):**
- Video thumbnail with play icon overlay.
- Duration badge (bottom-right, e.g., "3:45").
- Video indicator icon (camera icon or "VIDEO" label).

### Upgrade Prompt (Free/Professional Tier)

**Modal:**
- Title: "Unlock Video Uploads".
- Message: "Upload video walkthroughs for comprehensive site documentation. Available on Business plan and above."
- Feature highlights:
  - Upload videos up to 500 MB (Business) or 2 GB (Enterprise).
  - Adaptive streaming for smooth playback.
  - 100 GB video storage (Business) or unlimited (Enterprise).
- "Upgrade to Business" button ($99/month).

### Processing Status Indicators

**Timeline Thumbnail:**
- While processing: Thumbnail placeholder with spinner, "Processing video..." label.
- On success: Video thumbnail displayed.
- On failure: Error icon, "Processing failed" label, "Retry" button.

## API Endpoints

### POST /api/v1/captures/upload-url (Extend existing for video)

**Request Body:**
```
{
  "site_id": "uuid",
  "angle_id": "uuid",
  "file_name": "walkthrough_jan15.mp4",
  "file_type": "video/mp4",
  "file_size": 524288000 // 500 MB
}
```

**Response (200 OK):**
```
{
  "capture_id": "uuid",
  "upload_url": "https://s3.amazonaws.com/...",
  "s3_key": "videos/op-uuid/proj-uuid/site-uuid/capture-uuid.mp4",
  "expires_in": 600
}
```

**Validation:**
- User subscription tier Business or Enterprise.
- File type video/mp4 or video/quicktime.
- File size within tier limit (500 MB Business, 2 GB Enterprise).
- User has remaining video storage quota.

**Behavior:**
- Same as image upload, but separate S3 prefix (videos/ instead of captures/).

### POST /api/v1/captures/complete (Extend for video)

**Request Body:**
```
{
  "capture_id": "uuid",
  "s3_key": "videos/.../capture-uuid.mp4",
  "capture_date": "2025-01-15",
  "notes": "Full site walkthrough"
}
```

**Response (200 OK):**
```
{
  "capture_id": "uuid",
  "processing_status": "Processing",
  "message": "Video uploaded. Transcoding in progress."
}
```

**Behavior:**
- Create Capture record with file_type = Video, processing_status = Processing.
- Enqueue video transcoding job.

### GET /api/v1/captures/:id/playback-url

**Response (200 OK):**
```
{
  "capture_id": "uuid",
  "playback_url": "https://cdn.../videos/.../master.m3u8",
  "thumbnail_url": "https://cdn.../videos/.../thumbnail.jpg",
  "duration_seconds": 225,
  "resolutions": ["1080p", "720p", "480p"]
}
```

**Behavior:**
- Return HLS manifest URL for adaptive streaming.
- Return thumbnail URL.
- Video metadata (duration, available resolutions).

## Background Worker: Video Transcoding

### Job Queue

**Queue Name:** `video-transcoding`

**Job Triggered:** After video upload completion.

**Job Data:**
```
{
  "capture_id": "uuid",
  "s3_key": "videos/.../capture-uuid.mp4"
}
```

### Processing Steps

1. Download original video from S3.
2. Extract metadata (duration, resolution, codec) using FFprobe.
3. Generate thumbnail from 5-second mark using FFmpeg.
4. Upload thumbnail to S3.
5. Transcode video to multiple resolutions:
   - 1080p (1920x1080, H.264, 5 Mbps).
   - 720p (1280x720, H.264, 2.5 Mbps).
   - 480p (854x480, H.264, 1 Mbps).
6. Generate HLS playlist (master.m3u8 and variant playlists).
7. Upload transcoded files and playlists to S3.
8. Update Capture record:
   - thumbnail_path, processing_status = Ready.
   - Store duration, resolutions metadata.
9. Send notification email to user: "Your video is ready to view."

### Transcoding Service Options

**Option 1: AWS MediaConvert (Recommended)**
- Managed service, scalable, automatic retries.
- Cost: $0.015-0.030 per minute of video (varies by resolution).
- Rationale: Simplest integration, handles HLS generation, no infrastructure management.

**Option 2: Mux (API-based)**
- Video streaming API, excellent developer experience.
- Cost: $0.005 per minute + bandwidth.
- Rationale: Great for startups, includes CDN and analytics.

**Option 3: Self-hosted FFmpeg workers**
- Open-source, full control, lowest cost (compute only).
- Complexity: High (need to manage workers, storage, monitoring).
- Rationale: Cost-effective at scale but requires DevOps expertise.

**Recommended for MVP:** AWS MediaConvert or Mux.

### Error Handling

**Transient Errors:**
- Network timeout: Retry.
- Transcoding service rate limit: Retry with backoff.

**Permanent Errors:**
- Video file corrupted: Mark as Failed, notify user.
- Unsupported codec: Mark as Failed, suggest re-encoding.
- File too large (exceeds internal limit): Mark as Failed.

**On Permanent Failure:**
- Update Capture processing_status = Failed.
- Send email notification with error reason.
- Move job to dead letter queue.

## Test Scenarios

### Test 1: Business User Uploads Video

**Steps:**
1. Business tier user uploads 300 MB MP4 video.
2. Video uploads successfully.
3. Transcoding job starts.

**Expected:** Video transcoded, HLS playlist generated, thumbnail created, status = Ready.

### Test 2: File Size Exceeds Limit

**Steps:**
1. Business tier user attempts to upload 600 MB video (exceeds 500 MB limit).

**Expected:** Error "File size exceeds 500 MB limit for Business tier. Upgrade to Enterprise for 2 GB limit."

### Test 3: Free Tier Sees Upgrade Prompt

**Steps:**
1. Free tier user clicks "Upload Video".

**Expected:** Upgrade prompt displayed, access blocked.

### Test 4: Video Playback

**Steps:**
1. Upload and transcode video.
2. Click video thumbnail on timeline.
3. Video player loads.

**Expected:** Video plays, quality selector allows switching between resolutions.

### Test 5: Thumbnail Generation

**Steps:**
1. Upload video.
2. Transcoding completes.
3. Check timeline.

**Expected:** Video thumbnail displayed (frame from 5-second mark).

### Test 6: Video Storage Quota

**Steps:**
1. Business tier user has 95 GB of 100 GB used.
2. Attempts to upload 10 GB video.

**Expected:** Error "Video storage quota exceeded. Delete old videos or upgrade to Enterprise."

### Test 7: Transcoding Failure

**Steps:**
1. Upload corrupted video file.
2. Transcoding job fails.

**Expected:** Capture status = Failed, user notified via email, "Retry" button available.

### Test 8: Video in Timeline

**Steps:**
1. Upload video.
2. View timeline.

**Expected:** Video displayed alongside images with play icon overlay and duration badge.

### Test 9: Adaptive Streaming

**Steps:**
1. Play video on slow connection.
2. Check quality.

**Expected:** Player automatically selects lower resolution (480p) for smooth playback.

### Test 10: Fullscreen Playback

**Steps:**
1. Click fullscreen button.

**Expected:** Video enters fullscreen mode, controls remain accessible.

### Test 11: Download Original Video

**Steps:**
1. Click "Download" button on video detail page.

**Expected:** Original video file downloads (not transcoded version).

### Test 12: Video Processing Time

**Steps:**
1. Upload 5-minute video.
2. Measure transcoding time.

**Expected:** Transcoding completes in < 10 minutes (varies by service).

## Caveats and Edge Cases

### Very Long Videos

Videos >1 hour may take 30+ minutes to transcode. Display estimated time. Allow user to navigate away, notify via email when ready.

### Unsupported Codecs

Some MOV files use proprietary codecs (e.g., ProRes, H.265). Transcoding may fail. Suggest user re-encode to H.264 MP4.

### Audio Sync Issues

Transcoding may cause audio-video sync issues if original file variable frame rate (VFR). Use constant frame rate (CFR) during transcode.

### Thumbnail Timing

If video <5 seconds, generate thumbnail from midpoint instead of 5-second mark.

### Mobile Upload

Large videos (>500 MB) may take 10+ minutes to upload on mobile. Consider resumable uploads (S3 multipart) for better UX.

### Video Deletion

When user deletes video, delete original + all transcoded variants + HLS playlists to free storage.

### CDN Caching

Serve HLS playlists and video segments via CDN (CloudFront, Cloudflare) with long TTL (30 days). Invalidate on delete.

### Bandwidth Costs

Video streaming bandwidth costly. Monitor usage. Consider limiting video playback on Free tier (watermark or low resolution only).

## Performance Considerations

### Upload Performance

Use S3 Transfer Acceleration or multipart upload for large files (>100 MB). Improves upload speed by 2-5x.

### Transcoding Time

AWS MediaConvert: ~1x realtime (10-minute video takes ~10 minutes). Mux: ~0.5x realtime (faster).

### Video Player Load Time

HLS playlist and first segment load in < 2 seconds on broadband. Use adaptive bitrate to adjust quality based on network.

### Storage Optimization

Store only necessary resolutions. For short videos (<1 minute), 1080p and 720p sufficient (skip 480p).

## Monitoring and Observability

### Metrics to Track

- Videos uploaded per day.
- Average video file size.
- Transcoding success rate (%).
- Average transcoding time (minutes).
- Video playback starts (views).
- Playback errors (buffering, failed loads).

### Alerts

- Transcoding failure rate > 5%.
- Transcoding time > 20 minutes (performance degradation).
- Video storage exceeding 80% of quota.

### Dashboards

- Video upload volume over time.
- Transcoding job queue depth.
- Storage usage per operator.

## Security Checklist

- [ ] Feature gate enforced (subscription tier check).
- [ ] File type validation (prevent executable uploads).
- [ ] File size validation on backend (not just frontend).
- [ ] S3 bucket private (no public read).
- [ ] HLS playlists served via pre-signed URLs or CDN with token authentication.
- [ ] Authorization: User has access to site/project before viewing video.

===== END FILE: TASK_16_Video_Upload_Premium.md =====
