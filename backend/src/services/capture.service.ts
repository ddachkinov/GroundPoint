import { Capture, CaptureType, ProcessingStatus, WeatherCondition, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { storageService } from './storage.service';
import { siteService } from './site.service';
import {
  RequestUploadUrlInput,
  CompleteUploadInput,
  ListCapturesQuery,
} from '../validators/capture.validator';
import { enqueueThumbnailGeneration } from '../queues/thumbnail.queue';
import { s3Paths } from '../config/s3.config';

/**
 * Capture list response
 */
export interface CaptureListResponse {
  captures: Array<
    Capture & {
      siteName: string;
      angleName: string;
      uploadedByName: string;
    }
  >;
  total: number;
  limit: number;
  offset: number;
}

/**
 * Upload URL response
 */
export interface UploadUrlResponse {
  captureId: string;
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
}

/**
 * Capture service for managing image uploads
 */
class CaptureService {
  /**
   * Request pre-signed upload URL and create initial Capture record
   */
  async requestUploadUrl(
    input: RequestUploadUrlInput,
    userId: string,
    operatorOrgId: string
  ): Promise<UploadUrlResponse> {
    // Verify site exists and belongs to user's organization
    const site = await prisma.site.findUnique({
      where: { id: input.site_id },
      include: {
        project: {
          select: {
            id: true,
            operatorOrgId: true,
          },
        },
      },
    });

    if (!site) {
      throw new Error('Site not found');
    }

    if (site.project.operatorOrgId !== operatorOrgId) {
      throw new Error('Access denied');
    }

    // Verify angle exists and belongs to site
    const angle = await prisma.angle.findUnique({
      where: { id: input.angle_id },
    });

    if (!angle || angle.siteId !== input.site_id) {
      throw new Error('Invalid angle for this site');
    }

    // TODO: Check storage quota (requires subscription/billing implementation)
    // TODO: Check monthly upload count quota

    // Create initial Capture record with status UPLOADED (no file yet)
    const capture = await prisma.capture.create({
      data: {
        siteId: input.site_id,
        angleId: input.angle_id,
        uploadedByUserId: userId,
        captureDate: new Date(), // Temporary, will be updated in complete
        filePath: '', // Will be updated in complete
        fileSize: BigInt(input.file_size),
        fileType: CaptureType.IMAGE,
        processingStatus: ProcessingStatus.UPLOADED,
      },
    });

    // Generate pre-signed upload URL
    const projectId = site.project.id;
    const { uploadUrl, s3Key } = await storageService.generateUploadUrl(
      operatorOrgId,
      projectId,
      input.site_id,
      capture.id,
      input.file_name,
      input.file_type,
      input.file_size
    );

    return {
      captureId: capture.id,
      uploadUrl,
      s3Key,
      expiresIn: 600, // 10 minutes
    };
  }

  /**
   * Complete upload after file is uploaded to S3
   */
  async completeUpload(
    input: CompleteUploadInput,
    userId: string,
    operatorOrgId: string
  ): Promise<Capture> {
    // Get capture and verify ownership
    const capture = await prisma.capture.findUnique({
      where: { id: input.capture_id },
      include: {
        site: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!capture) {
      throw new Error('Capture not found');
    }

    if (capture.uploadedByUserId !== userId) {
      throw new Error('Access denied');
    }

    if (capture.site.project.operatorOrgId !== operatorOrgId) {
      throw new Error('Access denied');
    }

    // Verify file exists in S3
    const fileExists = await storageService.fileExists(input.s3_key);
    if (!fileExists) {
      throw new Error('File not found in storage. Upload may have failed.');
    }

    // Get file metadata from S3
    const metadata = await storageService.getFileMetadata(input.s3_key);

    // Parse capture date
    const captureDate = new Date(input.capture_date);

    // Update capture with metadata
    const updatedCapture = await prisma.capture.update({
      where: { id: input.capture_id },
      data: {
        filePath: input.s3_key,
        captureDate,
        latitude: input.latitude !== undefined ? new Prisma.Decimal(input.latitude) : null,
        longitude: input.longitude !== undefined ? new Prisma.Decimal(input.longitude) : null,
        weather: input.weather as WeatherCondition | undefined,
        notes: input.notes,
        fileSize: BigInt(metadata.contentLength),
        processingStatus: ProcessingStatus.PROCESSING, // Will be set to READY after thumbnail generation
      },
    });

    // Enqueue thumbnail generation job
    const extension = input.s3_key.includes('.') ? `.${input.s3_key.split('.').pop()}` : '.jpg';
    const thumbnailS3Key = s3Paths.thumbnailPath(
      operatorOrgId,
      capture.site.project.id,
      capture.siteId,
      input.capture_id
    );

    await enqueueThumbnailGeneration({
      captureId: input.capture_id,
      s3Key: input.s3_key,
      thumbnailS3Key,
      operatorOrgId,
      projectId: capture.site.project.id,
      siteId: capture.siteId,
    });

    // TODO: Update storage quota

    return updatedCapture;
  }

  /**
   * List captures for a site or angle
   */
  async listCaptures(
    query: ListCapturesQuery,
    operatorOrgId: string
  ): Promise<CaptureListResponse> {
    const { site_id, angle_id, start_date, end_date, limit = 50, offset = 0 } = query;

    // Build where clause
    const where: Prisma.CaptureWhereInput = {};

    if (site_id) {
      // Verify site belongs to user's organization
      const site = await prisma.site.findUnique({
        where: { id: site_id },
        include: {
          project: {
            select: {
              operatorOrgId: true,
            },
          },
        },
      });

      if (!site || site.project.operatorOrgId !== operatorOrgId) {
        throw new Error('Access denied');
      }

      where.siteId = site_id;
    }

    if (angle_id) {
      where.angleId = angle_id;
    }

    if (start_date || end_date) {
      where.captureDate = {};
      if (start_date) {
        where.captureDate.gte = new Date(start_date);
      }
      if (end_date) {
        where.captureDate.lte = new Date(end_date);
      }
    }

    // Get total count
    const total = await prisma.capture.count({ where });

    // Get captures with relations
    const captures = await prisma.capture.findMany({
      where,
      include: {
        site: {
          select: {
            name: true,
          },
        },
        angle: {
          select: {
            name: true,
          },
        },
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        captureDate: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Transform data
    const transformedCaptures = captures.map((capture) => ({
      ...capture,
      siteName: capture.site.name,
      angleName: capture.angle.name,
      uploadedByName: `${capture.uploadedBy.firstName} ${capture.uploadedBy.lastName}`,
    }));

    return {
      captures: transformedCaptures,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get capture by ID
   */
  async getCaptureById(
    captureId: string,
    operatorOrgId: string
  ): Promise<
    Capture & {
      siteName: string;
      angleName: string;
      uploadedByName: string;
      fileUrl?: string;
      thumbnailUrl?: string;
    }
  > {
    const capture = await prisma.capture.findUnique({
      where: { id: captureId },
      include: {
        site: {
          select: {
            name: true,
            project: {
              select: {
                operatorOrgId: true,
                id: true,
              },
            },
          },
        },
        angle: {
          select: {
            name: true,
          },
        },
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!capture) {
      throw new Error('Capture not found');
    }

    if (capture.site.project.operatorOrgId !== operatorOrgId) {
      throw new Error('Access denied');
    }

    // Generate pre-signed URLs for file and thumbnail
    let fileUrl: string | undefined;
    let thumbnailUrl: string | undefined;

    if (capture.filePath && capture.processingStatus !== ProcessingStatus.UPLOADED) {
      fileUrl = await storageService.generateDownloadUrl(capture.filePath);
    }

    if (capture.thumbnailPath) {
      thumbnailUrl = await storageService.generateDownloadUrl(capture.thumbnailPath);
    }

    return {
      ...capture,
      siteName: capture.site.name,
      angleName: capture.angle.name,
      uploadedByName: `${capture.uploadedBy.firstName} ${capture.uploadedBy.lastName}`,
      fileUrl,
      thumbnailUrl,
    };
  }

  /**
   * Delete capture and file from S3
   */
  async deleteCapture(captureId: string, userId: string, operatorOrgId: string): Promise<void> {
    const capture = await prisma.capture.findUnique({
      where: { id: captureId },
      include: {
        site: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!capture) {
      throw new Error('Capture not found');
    }

    // Check authorization: Must be uploader or Operator Admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const isAdmin = user?.role === 'OPERATOR_ADMIN';
    const isUploader = capture.uploadedByUserId === userId;

    if (!isAdmin && !isUploader) {
      throw new Error('Access denied');
    }

    if (capture.site.project.operatorOrgId !== operatorOrgId) {
      throw new Error('Access denied');
    }

    // Delete files from S3
    const filesToDelete: string[] = [];
    if (capture.filePath) {
      filesToDelete.push(capture.filePath);
    }
    if (capture.thumbnailPath) {
      filesToDelete.push(capture.thumbnailPath);
    }

    if (filesToDelete.length > 0) {
      await storageService.deleteFiles(filesToDelete);
    }

    // Delete capture record
    await prisma.capture.delete({
      where: { id: captureId },
    });

    // TODO: Decrement storage quota
  }

  /**
   * Clean up orphaned captures (captures with no file after 24 hours)
   * This should be called by a cron job
   */
  async cleanupOrphanedCaptures(): Promise<number> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const orphanedCaptures = await prisma.capture.findMany({
      where: {
        processingStatus: ProcessingStatus.UPLOADED,
        filePath: '',
        createdAt: {
          lt: twentyFourHoursAgo,
        },
      },
    });

    if (orphanedCaptures.length === 0) {
      return 0;
    }

    await prisma.capture.deleteMany({
      where: {
        id: {
          in: orphanedCaptures.map((c) => c.id),
        },
      },
    });

    return orphanedCaptures.length;
  }

  /**
   * Get calendar data (dates with capture counts for a month)
   */
  async getCalendarData(
    month: string,
    siteId?: string,
    projectId?: string,
    angleId?: string,
    operatorOrgId?: string
  ): Promise<Array<{ date: string; count: number }>> {
    // Parse month (format: YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    // Build where clause
    const where: Prisma.CaptureWhereInput = {
      captureDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (siteId) {
      // Verify site access
      const site = await prisma.site.findUnique({
        where: { id: siteId },
        include: {
          project: {
            select: {
              operatorOrgId: true,
            },
          },
        },
      });

      if (!site || (operatorOrgId && site.project.operatorOrgId !== operatorOrgId)) {
        throw new Error('Access denied');
      }

      where.siteId = siteId;
    } else if (projectId) {
      // Verify project access
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          operatorOrgId: true,
        },
      });

      if (!project || (operatorOrgId && project.operatorOrgId !== operatorOrgId)) {
        throw new Error('Access denied');
      }

      where.site = {
        projectId,
      };
    }

    if (angleId) {
      where.angleId = angleId;
    }

    // Group by date and count
    const results = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT
        DATE(capture_date) as date,
        COUNT(*) as count
      FROM captures
      WHERE
        capture_date >= ${startDate}
        AND capture_date <= ${endDate}
        ${siteId ? Prisma.sql`AND site_id = ${siteId}` : Prisma.empty}
        ${projectId && !siteId ? Prisma.sql`AND site_id IN (SELECT id FROM sites WHERE project_id = ${projectId})` : Prisma.empty}
        ${angleId ? Prisma.sql`AND angle_id = ${angleId}` : Prisma.empty}
      GROUP BY DATE(capture_date)
      ORDER BY date ASC
    `;

    return results.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      count: Number(row.count),
    }));
  }

  /**
   * Regenerate thumbnail for a capture
   */
  async regenerateThumbnail(
    captureId: string,
    userId: string,
    operatorOrgId: string
  ): Promise<void> {
    const capture = await prisma.capture.findUnique({
      where: { id: captureId },
      include: {
        site: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!capture) {
      throw new Error('Capture not found');
    }

    // Check authorization: Must be uploader or Operator Admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const isAdmin = user?.role === 'OPERATOR_ADMIN';
    const isUploader = capture.uploadedByUserId === userId;

    if (!isAdmin && !isUploader) {
      throw new Error('Access denied');
    }

    if (capture.site.project.operatorOrgId !== operatorOrgId) {
      throw new Error('Access denied');
    }

    // Verify file exists
    if (!capture.filePath) {
      throw new Error('Cannot regenerate thumbnail: Original file not found');
    }

    // Reset processing status
    await prisma.capture.update({
      where: { id: captureId },
      data: {
        processingStatus: ProcessingStatus.PROCESSING,
        errorMessage: null,
      },
    });

    // Generate thumbnail S3 key
    const thumbnailS3Key = s3Paths.thumbnailPath(
      operatorOrgId,
      capture.site.project.id,
      capture.siteId,
      captureId
    );

    // Enqueue thumbnail generation job
    await enqueueThumbnailGeneration({
      captureId,
      s3Key: capture.filePath,
      thumbnailS3Key,
      operatorOrgId,
      projectId: capture.site.project.id,
      siteId: capture.siteId,
    });
  }

  /**
   * Get captures for comparison
   */
  async getComparison(
    captureIds: string[],
    operatorOrgId: string
  ): Promise<
    Array<
      Capture & {
        siteName: string;
        angleName: string;
        uploadedByName: string;
        fileUrl?: string;
        thumbnailUrl?: string;
      }
    >
  > {
    // Validate number of captures
    if (captureIds.length < 2 || captureIds.length > 4) {
      throw new Error('Please select 2 to 4 captures for comparison');
    }

    // Get all captures
    const captures = await prisma.capture.findMany({
      where: {
        id: {
          in: captureIds,
        },
      },
      include: {
        site: {
          select: {
            name: true,
            project: {
              select: {
                id: true,
                operatorOrgId: true,
              },
            },
          },
        },
        angle: {
          select: {
            id: true,
            name: true,
          },
        },
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        captureDate: 'asc',
      },
    });

    // Check if all captures were found
    if (captures.length !== captureIds.length) {
      throw new Error('One or more captures not found');
    }

    // Check authorization: All captures must belong to user's organization
    const hasAccess = captures.every((c) => c.site.project.operatorOrgId === operatorOrgId);
    if (!hasAccess) {
      throw new Error('You do not have access to one or more selected captures');
    }

    // Check that all captures are from the same angle
    const angleIds = new Set(captures.map((c) => c.angleId));
    if (angleIds.size > 1) {
      throw new Error('All captures must be from the same angle');
    }

    // Check that all captures are from the same project
    const projectIds = new Set(captures.map((c) => c.site.project.id));
    if (projectIds.size > 1) {
      throw new Error('All captures must be from the same project');
    }

    // Generate pre-signed URLs for files and thumbnails
    const result = await Promise.all(
      captures.map(async (capture) => {
        let fileUrl: string | undefined;
        let thumbnailUrl: string | undefined;

        if (capture.filePath && capture.processingStatus !== ProcessingStatus.UPLOADED) {
          fileUrl = await storageService.generateDownloadUrl(capture.filePath);
        }

        if (capture.thumbnailPath) {
          thumbnailUrl = await storageService.generateDownloadUrl(capture.thumbnailPath);
        }

        return {
          ...capture,
          siteName: capture.site.name,
          angleName: capture.angle.name,
          uploadedByName: `${capture.uploadedBy.firstName} ${capture.uploadedBy.lastName}`,
          fileUrl,
          thumbnailUrl,
        };
      })
    );

    return result;
  }

  /**
   * Get captures for layered overlay with subscription tier check
   */
  async getOverlay(
    captureIds: string[],
    operatorOrgId: string
  ): Promise<{ captures: any[]; subscription_tier: string; feature_enabled: boolean }> {
    // Validate capture count
    if (captureIds.length < 2 || captureIds.length > 4) {
      throw new Error('Please select 2 to 4 captures for overlay');
    }

    // Get all captures
    const captures = await prisma.capture.findMany({
      where: {
        id: {
          in: captureIds,
        },
        site: {
          project: {
            operatorOrganizationId: operatorOrgId,
          },
        },
      },
      include: {
        site: {
          include: {
            project: true,
          },
        },
        angle: true,
      },
      orderBy: {
        captureDate: 'asc',
      },
    });

    // Check all captures found
    if (captures.length !== captureIds.length) {
      throw new Error('One or more captures not found or not accessible');
    }

    // Check same angle
    const angleIds = new Set(captures.map((c) => c.angleId));
    if (angleIds.size > 1) {
      throw new Error('All captures must be from the same angle for overlay');
    }

    // Check subscription tier
    const subscription = await prisma.operatorSubscription.findUnique({
      where: { organizationId: operatorOrgId },
    });

    const tier = subscription?.tier || 'FREE';
    const featureEnabled =
      tier === 'PROFESSIONAL' || tier === 'BUSINESS' || tier === 'ENTERPRISE';

    // Generate pre-signed URLs for captures
    const result = await Promise.all(
      captures.map(async (capture) => {
        let fileUrl: string | null = null;

        if (capture.filePath) {
          fileUrl = await storageService.generateDownloadUrl(capture.filePath);
        }

        return {
          capture_id: capture.id,
          capture_date: capture.captureDate.toISOString().split('T')[0],
          file_url: fileUrl,
          image_width: capture.imageWidth || 4000,
          image_height: capture.imageHeight || 3000,
        };
      })
    );

    return {
      captures: result,
      subscription_tier: tier,
      feature_enabled: featureEnabled,
    };
  }
}

export const captureService = new CaptureService();
