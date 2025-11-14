import { Router } from 'express';
import { captureController } from '../controllers/capture.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireOperator } from '../middleware/rbac.middleware';

const router = Router();

/**
 * All capture routes require authentication
 */
router.use(authMiddleware);

/**
 * Request pre-signed upload URL
 * POST /api/v1/captures/upload-url
 * Requires: Operator role
 */
router.post('/upload-url', requireOperator, (req, res) =>
  captureController.requestUploadUrl(req, res)
);

/**
 * Complete upload
 * POST /api/v1/captures/complete
 * Requires: Operator role
 */
router.post('/complete', requireOperator, (req, res) =>
  captureController.completeUpload(req, res)
);

/**
 * Get calendar data (dates with capture counts)
 * GET /api/v1/captures/calendar
 * Accessible by: All authenticated users
 */
router.get('/calendar', (req, res) => captureController.getCalendarData(req, res));

/**
 * Get captures for comparison
 * GET /api/v1/captures/compare
 * Accessible by: All authenticated users
 */
router.get('/compare', (req, res) => captureController.getComparison(req, res));

/**
 * Get captures for layered overlay (premium feature)
 * GET /api/v1/captures/overlay
 * Accessible by: Professional tier and above
 */
router.get('/overlay', (req, res) => captureController.getOverlay(req, res));

/**
 * List captures
 * GET /api/v1/captures
 * Accessible by: All authenticated users
 */
router.get('/', (req, res) => captureController.listCaptures(req, res));

/**
 * Get capture by ID
 * GET /api/v1/captures/:id
 * Accessible by: All authenticated users
 */
router.get('/:id', (req, res) => captureController.getCapture(req, res));

/**
 * Delete capture
 * DELETE /api/v1/captures/:id
 * Requires: Operator Admin or uploader
 */
router.delete('/:id', (req, res) => captureController.deleteCapture(req, res));

/**
 * Get playback URL for video captures
 * GET /api/v1/captures/:id/playback-url
 * Accessible by: All authenticated users (video captures only)
 */
router.get('/:id/playback-url', (req, res) => captureController.getPlaybackUrl(req, res));

/**
 * Regenerate thumbnail
 * POST /api/v1/captures/:id/regenerate-thumbnail
 * Requires: Operator Admin or uploader
 */
router.post('/:id/regenerate-thumbnail', (req, res) =>
  captureController.regenerateThumbnail(req, res)
);

export default router;
