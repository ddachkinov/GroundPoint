import { Capture, CaptureType, ProcessingStatus, WeatherCondition, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { storageService } from './storage.service';
import { siteService } from './site.service';
import {
  RequestUploadUrlInput,
  CompleteUploadInput,
  ListCapturesQuery,
} from '../validators/capture.validator';

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

    // TODO: Enqueue thumbnail generation job (TASK_05)
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
}

export const captureService = new CaptureService();
