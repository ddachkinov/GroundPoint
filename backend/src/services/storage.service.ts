import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, bucketConfig, s3Paths } from '../config/s3.config';

/**
 * S3 storage service for file uploads and retrieval
 */
export class StorageService {
  /**
   * Generate pre-signed URL for uploading a file to S3
   */
  async generateUploadUrl(
    operatorOrgId: string,
    projectId: string,
    siteId: string,
    captureId: string,
    fileName: string,
    fileType: string,
    fileSize: number
  ): Promise<{ uploadUrl: string; s3Key: string }> {
    // Get file extension from filename
    const extension = fileName.includes('.')
      ? `.${fileName.split('.').pop()}`
      : '';

    // Generate S3 key using organizational path structure
    const s3Key = s3Paths.capturePath(operatorOrgId, projectId, siteId, captureId, extension);

    // Create PutObject command
    const command = new PutObjectCommand({
      Bucket: bucketConfig.bucketName,
      Key: s3Key,
      ContentType: fileType,
      ContentLength: fileSize,
      Metadata: {
        'operator-org-id': operatorOrgId,
        'project-id': projectId,
        'site-id': siteId,
        'capture-id': captureId,
      },
    });

    // Generate pre-signed URL with expiration
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: bucketConfig.uploadExpiration,
    });

    return { uploadUrl, s3Key };
  }

  /**
   * Generate pre-signed URL for downloading a file from S3
   */
  async generateDownloadUrl(s3Key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucketConfig.bucketName,
      Key: s3Key,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: bucketConfig.downloadExpiration,
    });

    return downloadUrl;
  }

  /**
   * Check if a file exists in S3
   */
  async fileExists(s3Key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucketConfig.bucketName,
        Key: s3Key,
      });

      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata from S3
   */
  async getFileMetadata(s3Key: string): Promise<{
    contentLength: number;
    contentType: string;
    lastModified: Date;
  }> {
    const command = new HeadObjectCommand({
      Bucket: bucketConfig.bucketName,
      Key: s3Key,
    });

    const response = await s3Client.send(command);

    return {
      contentLength: response.ContentLength || 0,
      contentType: response.ContentType || 'application/octet-stream',
      lastModified: response.LastModified || new Date(),
    };
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(s3Key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucketConfig.bucketName,
      Key: s3Key,
    });

    await s3Client.send(command);
  }

  /**
   * Delete multiple files from S3
   */
  async deleteFiles(s3Keys: string[]): Promise<void> {
    await Promise.all(s3Keys.map((key) => this.deleteFile(key)));
  }

  /**
   * Generate thumbnail path for a capture
   */
  getThumbnailPath(
    operatorOrgId: string,
    projectId: string,
    siteId: string,
    captureId: string,
    size: 'small' | 'medium' | 'large' = 'medium'
  ): string {
    return s3Paths.thumbnailPath(operatorOrgId, projectId, siteId, captureId, size);
  }
}

export const storageService = new StorageService();
