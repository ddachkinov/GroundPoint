import { S3Client } from '@aws-sdk/client-s3';

/**
 * S3 client configuration
 */
export const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT, // For MinIO or custom S3-compatible storage
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true', // Required for MinIO
};

/**
 * S3 bucket configuration
 */
export const bucketConfig = {
  bucketName: process.env.S3_BUCKET_NAME || 'groundpoint-uploads',
  region: process.env.AWS_REGION || 'us-east-1',
  uploadExpiration: parseInt(process.env.S3_UPLOAD_EXPIRATION || '600', 10), // 10 minutes
  downloadExpiration: parseInt(process.env.S3_DOWNLOAD_EXPIRATION || '3600', 10), // 1 hour
};

/**
 * Create S3 client instance
 */
export const s3Client = new S3Client(s3Config);

/**
 * S3 path structure
 */
export const s3Paths = {
  /**
   * Generate capture file path
   */
  capturePath: (operatorOrgId: string, projectId: string, siteId: string, captureId: string, extension: string): string => {
    return `captures/${operatorOrgId}/${projectId}/${siteId}/${captureId}${extension}`;
  },

  /**
   * Generate thumbnail path
   */
  thumbnailPath: (operatorOrgId: string, projectId: string, siteId: string, captureId: string, size: string = 'medium'): string => {
    return `thumbnails/${operatorOrgId}/${projectId}/${siteId}/${captureId}_${size}.jpg`;
  },
};
