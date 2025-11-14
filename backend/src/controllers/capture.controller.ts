import { Request, Response } from 'express';
import { captureService } from '../services/capture.service';
import {
  requestUploadUrlSchema,
  completeUploadSchema,
  listCapturesQuerySchema,
} from '../validators/capture.validator';

/**
 * Capture controller for image upload endpoints
 */
class CaptureController {
  /**
   * Request pre-signed upload URL
   * POST /api/v1/captures/upload-url
   */
  async requestUploadUrl(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const validatedInput = requestUploadUrlSchema.parse(req.body);

      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Request upload URL
      const response = await captureService.requestUploadUrl(
        validatedInput,
        user.id,
        user.organizationId
      );

      res.status(200).json({
        capture_id: response.captureId,
        upload_url: response.uploadUrl,
        s3_key: response.s3Key,
        expires_in: response.expiresIn,
      });
    } catch (error: any) {
      console.error('Error requesting upload URL:', error);

      if (error.name === 'ZodError') {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      if (
        error.message.includes('not found') ||
        error.message.includes('Invalid angle')
      ) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('Access denied')) {
        res.status(403).json({ error: error.message });
        return;
      }

      if (error.message.includes('quota')) {
        res.status(403).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Complete upload after file uploaded to S3
   * POST /api/v1/captures/complete
   */
  async completeUpload(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const validatedInput = completeUploadSchema.parse(req.body);

      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Complete upload
      const capture = await captureService.completeUpload(
        validatedInput,
        user.id,
        user.organizationId
      );

      res.status(200).json({
        capture_id: capture.id,
        processing_status: capture.processingStatus,
        message: 'Upload complete. Thumbnail generation in progress.',
      });
    } catch (error: any) {
      console.error('Error completing upload:', error);

      if (error.name === 'ZodError') {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('Access denied')) {
        res.status(403).json({ error: error.message });
        return;
      }

      if (error.message.includes('Upload may have failed')) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * List captures with filtering
   * GET /api/v1/captures
   */
  async listCaptures(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Parse and validate query parameters
      const query = {
        ...req.query,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      };

      const validatedQuery = listCapturesQuerySchema.parse(query);

      // List captures
      const response = await captureService.listCaptures(
        validatedQuery,
        user.organizationId
      );

      res.status(200).json({
        captures: response.captures.map((capture) => ({
          capture_id: capture.id,
          site_id: capture.siteId,
          site_name: capture.siteName,
          angle_id: capture.angleId,
          angle_name: capture.angleName,
          capture_date: capture.captureDate,
          file_size: capture.fileSize.toString(),
          image_width: capture.imageWidth,
          image_height: capture.imageHeight,
          latitude: capture.latitude?.toString(),
          longitude: capture.longitude?.toString(),
          weather: capture.weather,
          notes: capture.notes,
          uploaded_by_user_id: capture.uploadedByUserId,
          uploaded_by_user_name: capture.uploadedByName,
          processing_status: capture.processingStatus,
          created_at: capture.createdAt,
        })),
        total: response.total,
        limit: response.limit,
        offset: response.offset,
      });
    } catch (error: any) {
      console.error('Error listing captures:', error);

      if (error.name === 'ZodError') {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      if (error.message.includes('Access denied')) {
        res.status(403).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get capture by ID
   * GET /api/v1/captures/:id
   */
  async getCapture(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const captureId = req.params.id;

      // Get capture
      const capture = await captureService.getCaptureById(captureId, user.organizationId);

      res.status(200).json({
        capture: {
          capture_id: capture.id,
          site_id: capture.siteId,
          site_name: capture.siteName,
          angle_id: capture.angleId,
          angle_name: capture.angleName,
          capture_date: capture.captureDate,
          file_url: capture.fileUrl,
          thumbnail_url: capture.thumbnailUrl,
          file_size: capture.fileSize.toString(),
          image_width: capture.imageWidth,
          image_height: capture.imageHeight,
          latitude: capture.latitude?.toString(),
          longitude: capture.longitude?.toString(),
          weather: capture.weather,
          notes: capture.notes,
          uploaded_by_user_id: capture.uploadedByUserId,
          uploaded_by_user_name: capture.uploadedByName,
          processing_status: capture.processingStatus,
          created_at: capture.createdAt,
        },
      });
    } catch (error: any) {
      console.error('Error getting capture:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('Access denied')) {
        res.status(403).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete capture
   * DELETE /api/v1/captures/:id
   */
  async deleteCapture(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const captureId = req.params.id;

      // Delete capture
      await captureService.deleteCapture(captureId, user.id, user.organizationId);

      res.status(200).json({ message: 'Capture deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting capture:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('Access denied')) {
        res.status(403).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get calendar data (dates with capture counts)
   * GET /api/v1/captures/calendar
   */
  async getCalendarData(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { month, site_id, project_id, angle_id } = req.query;

      // Default to current month if not provided
      const targetMonth = month
        ? (month as string)
        : new Date().toISOString().slice(0, 7);

      // Validate month format
      if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
        res.status(400).json({ error: 'Invalid month format. Use YYYY-MM.' });
        return;
      }

      // Get calendar data
      const dates = await captureService.getCalendarData(
        targetMonth,
        site_id as string | undefined,
        project_id as string | undefined,
        angle_id as string | undefined,
        user.organizationId
      );

      res.status(200).json({
        month: targetMonth,
        dates,
      });
    } catch (error: any) {
      console.error('Error getting calendar data:', error);

      if (error.message.includes('Access denied')) {
        res.status(403).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Regenerate thumbnail for a capture
   * POST /api/v1/captures/:id/regenerate-thumbnail
   */
  async regenerateThumbnail(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const captureId = req.params.id;

      // Regenerate thumbnail
      await captureService.regenerateThumbnail(captureId, user.id, user.organizationId);

      res.status(200).json({
        message: 'Thumbnail generation enqueued',
        capture_id: captureId,
      });
    } catch (error: any) {
      console.error('Error regenerating thumbnail:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('Access denied')) {
        res.status(403).json({ error: error.message });
        return;
      }

      if (error.message.includes('Cannot regenerate thumbnail')) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get captures for comparison
   * GET /api/v1/captures/compare
   */
  async getComparison(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { ids } = req.query;

      if (!ids || typeof ids !== 'string') {
        res.status(400).json({ error: 'Capture IDs required (comma-separated)' });
        return;
      }

      // Parse comma-separated IDs
      const captureIds = ids.split(',').map((id) => id.trim());

      // Get comparison captures
      const captures = await captureService.getComparison(captureIds, user.organizationId);

      res.status(200).json({
        captures: captures.map((capture) => ({
          capture_id: capture.id,
          site_id: capture.siteId,
          site_name: capture.siteName,
          angle_id: capture.angleId,
          angle_name: capture.angleName,
          capture_date: capture.captureDate,
          file_url: capture.fileUrl,
          thumbnail_url: capture.thumbnailUrl,
          file_size: capture.fileSize.toString(),
          image_width: capture.imageWidth,
          image_height: capture.imageHeight,
          latitude: capture.latitude?.toString(),
          longitude: capture.longitude?.toString(),
          weather: capture.weather,
          notes: capture.notes,
          uploaded_by_user_id: capture.uploadedByUserId,
          uploaded_by_user_name: capture.uploadedByName,
          processing_status: capture.processingStatus,
          created_at: capture.createdAt,
        })),
      });
    } catch (error: any) {
      console.error('Error getting comparison:', error);

      if (error.message.includes('2 to 4 captures')) {
        res.status(400).json({ error: error.message });
        return;
      }

      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('Access denied') || error.message.includes('do not have access')) {
        res.status(403).json({ error: error.message });
        return;
      }

      if (error.message.includes('same angle') || error.message.includes('same project')) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const captureController = new CaptureController();
