===== BEGIN FILE: TASK_04_Image_Upload_Infrastructure.md =====

# TASK 04: Image Upload Infrastructure

## Purpose

Implement secure, scalable image upload pipeline using pre-signed S3 URLs. Operators upload progress photos with metadata (capture date, GPS, angle, weather, notes) for time-series documentation.

## Priority

Critical. Core functionality for platform value proposition.

## Dependencies

- TASK_01: Authentication System.
- TASK_02: Projects and Sites CRUD.
- S3-compatible storage configured (AWS S3, Cloudflare R2, MinIO).
- Database schema for Capture and Angle entities.

## Acceptance Criteria

1. Operator can select image file from device (web or mobile).
2. Frontend requests pre-signed S3 upload URL from backend.
3. Backend validates user quota, permissions, and file type, generates pre-signed URL with 10-minute expiration.
4. Frontend uploads file directly to S3 using pre-signed URL (bypassing backend for file transfer).
5. On successful upload, frontend calls completion endpoint with S3 key and metadata.
6. Backend creates Capture record in database with processing status "Uploaded".
7. Capture metadata includes: capture date, angle, GPS coordinates, weather, notes.
8. Supported formats: JPEG, PNG, TIFF (max 50 MB for MVP).
9. Upload quota enforced: Storage total and monthly upload count per subscription tier.
10. Upload progress displayed in UI with cancel capability.
11. Concurrent uploads supported (max 10 per user).
12. Failed uploads can be retried.

## UI Description

### Upload Button (Site Detail Page / Timeline)

**Location:** Floating action button (FAB) on timeline page, or "Upload Image" button on site detail page.

**Icon:** Camera or upload icon.

**Interactions:**
- Click to open file picker.
- Multi-select enabled (upload multiple images sequentially or in batch).

### Upload Dialog

**Components:**
- File preview thumbnails (generated client-side from selected files).
- For each file, form fields:
  - Capture Date (date picker, defaults to today, can backdate).
  - Angle (dropdown, list of angles defined for this site, or "Add new angle").
  - GPS Coordinates (auto-populated from EXIF if available, editable: lat, lon).
  - Weather (dropdown: Sunny, Cloudy, Rainy, Snowy, optional).
  - Notes (textarea, max 500 chars, optional).
- Upload All and Cancel buttons.
- Progress bar per file showing upload percentage.

**Interactions:**
- On "Upload All", for each file:
  1. Request pre-signed URL.
  2. Upload file to S3 with progress tracking.
  3. Call completion endpoint.
  4. Mark as complete or failed.
- On success: Show toast "Uploaded [n] images successfully", refresh timeline.
- On failure: Show error for specific file, allow retry.
- On cancel: Abort pending uploads (uploaded files remain).

### Add New Angle (within Upload Dialog)

**Components:**
- Quick-add angle: Text input for angle name, "Add" button.
- Angle created on-the-fly and available in dropdown.

### Upload Status Indicators

**Components:**
- Per-file status: Queued, Uploading (with %), Processing, Complete, Failed.
- Overall progress: "Uploading 3 of 10 images".

### Quota Warning

**Components:**
- If nearing storage quota (e.g., >90% used), display warning banner: "You're running out of storage. [Upgrade] to continue uploading."
- If quota exceeded, prevent upload and show error: "Storage quota exceeded. [Upgrade] or [delete old images]."

## API Endpoints

### POST /api/v1/captures/upload-url

**Request Body:**
```
{
  "site_id": "uuid",
  "angle_id": "uuid",
  "file_name": "facade_jan15.jpg",
  "file_type": "image/jpeg",
  "file_size": 5242880
}
```

**Response (200 OK):**
```
{
  "capture_id": "uuid",
  "upload_url": "https://s3.amazonaws.com/bucket/path?X-Amz-Signature=...",
  "s3_key": "captures/op-uuid/proj-uuid/site-uuid/capture-uuid.jpg",
  "expires_in": 600
}
```

**Validation:**
- Site exists and user has access (Operator Admin/Member assigned to project).
- Angle exists and belongs to site.
- File type supported (JPEG, PNG, TIFF).
- File size within limit (50 MB for MVP).
- User has remaining storage quota.
- User has remaining upload count quota for current billing period.

**Behavior:**
- Create Capture record with status "Uploaded" (no file yet).
- Generate pre-signed POST URL for S3 with 10-minute expiration.
- Return capture_id and upload_url.

### POST /api/v1/captures/complete

**Request Body:**
```
{
  "capture_id": "uuid",
  "s3_key": "captures/.../capture-uuid.jpg",
  "capture_date": "2025-01-15",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "weather": "Sunny",
  "notes": "Clear day, good visibility"
}
```

**Response (200 OK):**
```
{
  "capture_id": "uuid",
  "processing_status": "Processing",
  "message": "Upload complete. Thumbnail generation in progress."
}
```

**Validation:**
- Capture exists and belongs to user's organization.
- S3 key matches expected format.
- Capture date not in future.
- GPS coordinates valid range.

**Behavior:**
- Verify file exists in S3 (HEAD request).
- Update Capture record with metadata and file_path.
- Extract image dimensions (width, height) from S3 metadata or EXIF.
- Update user's storage quota (increment by file size).
- Increment monthly upload counter.
- Enqueue thumbnail generation job (TASK_05).
- Return capture_id and processing_status.

### GET /api/v1/captures/:id

**Response (200 OK):**
```
{
  "capture_id": "uuid",
  "site_id": "uuid",
  "site_name": "North Facade",
  "angle_id": "uuid",
  "angle_name": "Ground Level",
  "capture_date": "2025-01-15",
  "file_url": "https://cdn.example.com/captures/.../capture-uuid.jpg",
  "thumbnail_url": "https://cdn.example.com/thumbnails/.../capture-uuid_thumb.jpg",
  "file_size": 5242880,
  "image_width": 4000,
  "image_height": 3000,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "weather": "Sunny",
  "notes": "Clear day, good visibility",
  "uploaded_by_user_id": "uuid",
  "uploaded_by_user_name": "John Doe",
  "processing_status": "Ready",
  "created_at": "2025-01-15T14:30:00Z"
}
```

**Behavior:**
- Return pre-signed URL for file (if private S3 bucket, 1-hour expiration).
- Return thumbnail URL (via CDN if available).

### DELETE /api/v1/captures/:id

**Response (200 OK):**
```
{
  "message": "Capture deleted successfully"
}
```

**Authorization:** Operator Admin or user who uploaded the capture (if Operator Member).

**Behavior:**
- Delete file and thumbnail from S3.
- Delete Capture record from database.
- Decrement user's storage quota.

## Test Scenarios

### Test 1: Successful Upload Flow

**Steps:**
1. User selects JPEG file (5 MB).
2. Fills metadata (date, angle, GPS, notes).
3. Clicks Upload.
4. Frontend requests pre-signed URL.
5. Frontend uploads to S3.
6. Frontend calls completion endpoint.

**Expected:** Capture created, file in S3, thumbnail enqueued, quota updated.

### Test 2: Unsupported File Type

**Steps:**
1. User selects BMP file.
2. Attempts to upload.

**Expected:** Error "File type not supported. Please upload JPEG, PNG, or TIFF." (400).

### Test 3: File Size Exceeds Limit

**Steps:**
1. User selects 60 MB JPEG.
2. Attempts to upload.

**Expected:** Error "File size exceeds 50 MB limit." (400).

### Test 4: Storage Quota Exceeded

**Steps:**
1. Free tier user has 1.9 GB used (2 GB quota).
2. Attempts to upload 200 MB file.

**Expected:** Error "Storage quota exceeded. Upgrade or delete images to continue." (403).

### Test 5: Upload Count Quota Exceeded

**Steps:**
1. Free tier user has uploaded 100 images this month (quota limit).
2. Attempts to upload another.

**Expected:** Error "Monthly upload limit reached. Upgrade to continue." (403).

### Test 6: Pre-Signed URL Expiration

**Steps:**
1. Request pre-signed URL.
2. Wait 11 minutes.
3. Attempt to upload to expired URL.

**Expected:** S3 returns 403 Forbidden, frontend displays error and allows retry.

### Test 7: Concurrent Uploads

**Steps:**
1. User selects 5 images.
2. Uploads all simultaneously.

**Expected:** All uploads succeed, progress tracked independently.

### Test 8: Upload Cancellation

**Steps:**
1. Start uploading 10 MB file.
2. Click cancel mid-upload.

**Expected:** Upload aborted, file not saved, Capture record remains in "Uploaded" state (can be cleaned up by cron).

### Test 9: EXIF GPS Extraction

**Steps:**
1. Upload JPEG with EXIF GPS data.

**Expected:** GPS coordinates auto-populated in upload form.

### Test 10: Missing Angle

**Steps:**
1. Attempt to upload without selecting angle.

**Expected:** Error "Angle is required." (400).

### Test 11: Future Capture Date

**Steps:**
1. Set capture date to tomorrow.
2. Attempt to upload.

**Expected:** Error "Capture date cannot be in the future." (400).

### Test 12: Delete Capture

**Steps:**
1. Upload image.
2. Delete via DELETE /api/v1/captures/:id.

**Expected:** File and thumbnail deleted from S3, database record deleted, quota decremented.

## Caveats and Edge Cases

### Orphaned Captures

If user requests pre-signed URL but never completes upload, Capture record remains with status "Uploaded" and no file. Run daily cron job to delete orphaned captures older than 24 hours.

### S3 Upload Verification

In completion endpoint, verify file exists in S3 before marking as complete. If file missing (e.g., upload failed but frontend called completion), return error and allow retry.

### Storage Quota Race Condition

Multiple concurrent uploads may bypass quota check. Use database transactions and atomic counters (Redis) to prevent.

### Large File Upload UX

For files near 50 MB, upload may take several minutes on slow connections. Display estimated time remaining and allow background uploads (user can navigate away, upload continues).

### EXIF Data Privacy

Some images contain sensitive EXIF data (e.g., GPS of photographer's home if using phone). Offer option to strip EXIF data on upload (except GPS, which user explicitly provides).

### Image Rotation

Some images display rotated due to EXIF orientation tag. Backend should auto-rotate images to correct orientation during thumbnail generation.

### File Name Conflicts

Use capture_id as S3 file name (UUID) to prevent conflicts, regardless of original file name.

### Multipart Upload for Large Files

For files >50 MB (post-MVP), consider S3 multipart upload for better resumability and performance.

### CDN Caching

Serve images via CDN (CloudFront, Cloudflare) with long TTL (30 days). Invalidate CDN cache on delete.

### Image Compression

Consider optional client-side compression to reduce upload time and storage costs. Preserve original resolution but reduce file size (e.g., JPEG quality 90).

### Offline Upload

For mobile app (future), support offline queuing: User selects images while offline, uploads when connection restored.

## Performance Considerations

### Pre-Signed URL Generation

Generating pre-signed URLs is fast (<10ms). No caching needed.

### S3 Upload Speed

Upload speed limited by user's connection. Frontend should handle slow uploads gracefully with progress indicator.

### Database Write

Capture record creation and update are fast (<50ms). Use database connection pooling.

### Quota Check Performance

Storage quota: Query SUM(file_size) WHERE operator_org_id = X. Cache result in Redis with 5-minute TTL, invalidate on upload/delete.

Upload count quota: Maintain counter in Redis, reset monthly (key: "upload_count:{org_id}:{year}-{month}", TTL = 35 days).

### Concurrent Upload Limit

Limit to 10 concurrent uploads per user to prevent resource exhaustion. Enforce in frontend and backend (rate limiting).

## Security Checklist

- [ ] Pre-signed URLs expire in 10 minutes.
- [ ] S3 bucket private (no public read).
- [ ] File type validation on backend (do not trust client-provided MIME type, verify file signature/magic bytes).
- [ ] File size validation on backend and enforced by S3 bucket policy.
- [ ] Capture records scoped to user's organization (prevent cross-org access).
- [ ] Quota enforcement prevents abuse.
- [ ] EXIF data sanitized if privacy risk.
- [ ] S3 keys use UUIDs (not predictable).
- [ ] Authorization required for all endpoints.
- [ ] Rate limiting on upload URL generation (max 100 per hour per user).

===== END FILE: TASK_04_Image_Upload_Infrastructure.md =====
