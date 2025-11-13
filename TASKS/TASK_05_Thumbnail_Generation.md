===== BEGIN FILE: TASK_05_Thumbnail_Generation.md =====

# TASK 05: Thumbnail Generation Worker

## Purpose

Asynchronously generate thumbnails for uploaded images using background workers. Thumbnails enable fast timeline browsing and reduce bandwidth.

## Priority

High. Required for performant timeline UI.

## Dependencies

- TASK_04: Image Upload Infrastructure.
- BullMQ and Redis configured for job queue.
- Image processing library (Sharp for Node.js, Pillow for Python).

## Acceptance Criteria

1. After image upload completion, thumbnail generation job enqueued.
2. Background worker processes job: downloads original from S3, resizes to thumbnail (max 400px width, maintains aspect ratio), uploads to S3.
3. Thumbnail JPEG quality 85, format always JPEG regardless of source format.
4. Capture record updated with thumbnail_path and processing_status set to "Ready".
5. Failed jobs retried up to 3 times with exponential backoff (10s, 30s, 90s).
6. After 3 failures, processing_status set to "Failed" and error logged.
7. Worker handles EXIF orientation (auto-rotate if needed).
8. Job processing time: p95 < 10 seconds.
9. Worker scalable: Multiple workers can process jobs concurrently.
10. Dead letter queue for permanently failed jobs (manual review).

## UI Description

No direct UI. Thumbnail generation happens in background. User sees processing status indicators:

### Processing Status (Timeline)

**Components:**
- While processing: Thumbnail placeholder with spinner and "Processing..." label.
- On success: Thumbnail displayed.
- On failure: Placeholder with warning icon and "Processing failed" label, "Retry" button.

**Interactions:**
- Click "Retry" to re-enqueue thumbnail generation job.

## API Endpoints

### POST /api/v1/captures/:id/regenerate-thumbnail

**Response (200 OK):**
```
{
  "message": "Thumbnail generation enqueued",
  "capture_id": "uuid"
}
```

**Authorization:** Operator Admin or user who uploaded capture.

**Behavior:**
- Re-enqueue thumbnail generation job.
- Reset processing_status to "Processing".

## Job Queue Structure

### Queue Name

`thumbnail-generation`

### Job Data

```
{
  "capture_id": "uuid",
  "s3_key": "captures/.../capture-uuid.jpg",
  "thumbnail_s3_key": "thumbnails/.../capture-uuid_thumb.jpg"
}
```

### Job Options

```
{
  "attempts": 3,
  "backoff": {
    "type": "exponential",
    "delay": 10000 // 10 seconds base delay
  },
  "removeOnComplete": true,
  "removeOnFail": false
}
```

## Worker Implementation

### Processing Steps

1. Receive job from queue.
2. Fetch Capture record from database by capture_id.
3. Download original image from S3 using s3_key.
4. Load image using Sharp (or Pillow).
5. Check EXIF orientation, auto-rotate if needed.
6. Resize image:
   - Max width 400px.
   - Maintain aspect ratio.
   - Use high-quality algorithm (Lanczos).
7. Convert to JPEG with quality 85.
8. Upload thumbnail to S3 using thumbnail_s3_key.
9. Update Capture record:
   - thumbnail_path = thumbnail_s3_key.
   - processing_status = "Ready".
10. Mark job as complete.

### Error Handling

**Transient Errors (Retry):**
- Network timeout downloading from S3.
- Temporary S3 service unavailability.
- Redis connection lost.

**Permanent Errors (Fail):**
- Original file not found in S3 (orphaned capture).
- Image file corrupted (cannot decode).
- Unsupported image format (despite validation).
- S3 upload permission denied.

**On Permanent Failure:**
- Update Capture processing_status to "Failed".
- Log error with capture_id, s3_key, error message.
- Move job to dead letter queue for manual review.

### Logging

Log job lifecycle:
- Job started: "Thumbnail generation started for capture_id={id}".
- Job completed: "Thumbnail generated successfully for capture_id={id}, duration={ms}ms".
- Job failed: "Thumbnail generation failed for capture_id={id}, attempt={n}, error={message}".
- Job permanently failed: "Thumbnail generation permanently failed for capture_id={id}, error={message}".

## Test Scenarios

### Test 1: Successful Thumbnail Generation

**Steps:**
1. Upload image (JPEG, 4000x3000).
2. Verify job enqueued.
3. Worker processes job.
4. Verify thumbnail created in S3 (400x300).
5. Verify Capture processing_status = "Ready".

**Expected:** Thumbnail displayed in timeline.

### Test 2: EXIF Orientation Handling

**Steps:**
1. Upload image with EXIF orientation tag (e.g., rotated 90 degrees).
2. Worker generates thumbnail.

**Expected:** Thumbnail auto-rotated to correct orientation.

### Test 3: TIFF Source Image

**Steps:**
1. Upload TIFF image.
2. Worker generates thumbnail.

**Expected:** Thumbnail in JPEG format regardless of source.

### Test 4: Transient S3 Error (Retry)

**Steps:**
1. Mock S3 download to fail once, succeed on retry.
2. Worker processes job.

**Expected:** Job retried, thumbnail generated successfully on second attempt.

### Test 5: Permanent Failure (Corrupted Image)

**Steps:**
1. Upload image, manually corrupt file in S3.
2. Worker attempts to process.

**Expected:** Job fails after 3 attempts, processing_status = "Failed", logged to dead letter queue.

### Test 6: Concurrent Job Processing

**Steps:**
1. Enqueue 100 thumbnail jobs.
2. Run 5 worker instances.

**Expected:** All jobs processed concurrently, average processing time acceptable.

### Test 7: Retry from UI

**Steps:**
1. Capture has processing_status = "Failed".
2. User clicks "Retry" button.

**Expected:** Job re-enqueued, thumbnail eventually generated.

### Test 8: Job Processing Time

**Steps:**
1. Upload 50 images of varying sizes (1 MB to 50 MB).
2. Measure processing time for each.

**Expected:** p95 processing time < 10 seconds.

### Test 9: Thumbnail Quality

**Steps:**
1. Upload high-resolution image (8000x6000).
2. Generate thumbnail.
3. Verify thumbnail quality visually.

**Expected:** Thumbnail sharp and clear, no visible artifacts.

### Test 10: Thumbnail File Size

**Steps:**
1. Generate thumbnail from 50 MB source image.

**Expected:** Thumbnail file size < 100 KB.

## Caveats and Edge Cases

### Large Images

Very large images (>100 MP) may take longer to process or cause memory issues. Consider limiting resolution or using tiled processing.

### Animated Images

GIFs and animated PNGs not supported in MVP. If encountered, generate thumbnail from first frame or reject during upload.

### Thumbnails for Videos

Videos (post-MVP) require different processing: Extract frame at 5-second mark, generate thumbnail from that frame.

### Worker Resource Usage

Image processing CPU and memory intensive. Monitor worker resource usage. Scale horizontally (add more workers) rather than vertically (larger instances).

### S3 Transfer Costs

Downloading and uploading images incurs data transfer costs. Optimize by running workers in same AWS region as S3 bucket (or use S3 Transfer Acceleration).

### Thumbnail CDN Invalidation

If thumbnail regenerated (e.g., after retry), invalidate CDN cache for old thumbnail URL.

### Race Condition on Completion Endpoint

If user calls completion endpoint twice rapidly, two thumbnail jobs may be enqueued. Use idempotency: Check if job already exists for capture_id before enqueuing.

### Dead Letter Queue Monitoring

Set up alerting for dead letter queue depth. If >10 jobs in DLQ, investigate common failure patterns.

### Job Timeout

Set per-job timeout (e.g., 5 minutes). If processing exceeds timeout, kill job and mark as failed (prevents zombie jobs).

### Graceful Shutdown

Workers should handle SIGTERM gracefully: Finish current job before shutting down, do not accept new jobs.

## Performance Considerations

### Image Processing Algorithm

Use Lanczos resampling for high quality. Faster algorithms (nearest neighbor, bilinear) produce lower quality thumbnails.

### Memory Management

Sharp (Node.js) is memory-efficient but can spike for large images. Set worker memory limit (e.g., 512 MB) and monitor.

### S3 Download Optimization

Use S3 Transfer Acceleration or CloudFront to speed up downloads from distant regions.

### Parallel Processing

Sharp supports multi-threaded processing. Ensure worker instances have multiple CPU cores.

### Job Priority

If queue backlog grows, prioritize recent uploads (users likely waiting) over old failed jobs (retries).

## Monitoring and Observability

### Metrics to Track

- Job enqueue rate (jobs/second).
- Job processing rate (jobs/second).
- Queue depth (pending jobs).
- Job processing time (p50, p95, p99).
- Job failure rate (%).
- Dead letter queue depth.
- Worker CPU and memory usage.

### Alerts

- Queue depth > 1000 (scale up workers).
- Job failure rate > 5% (investigate common errors).
- Dead letter queue depth > 10 (manual review needed).
- Worker instance unhealthy (restart).

### Dashboards

- Real-time queue depth chart.
- Job processing time histogram.
- Failure reasons breakdown (pie chart).
- Worker resource usage over time.

## Security Checklist

- [ ] Worker has least-privilege IAM role (read/write specific S3 paths only).
- [ ] S3 keys validated before download (prevent path traversal).
- [ ] Thumbnail S3 bucket same security as originals (private).
- [ ] Error messages do not expose sensitive paths or keys.
- [ ] Worker logs do not contain image data.
- [ ] Redis queue traffic encrypted (TLS).

===== END FILE: TASK_05_Thumbnail_Generation.md =====
