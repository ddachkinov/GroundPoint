import { z } from 'zod';

/**
 * Supported file types
 */
const SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff'];

/**
 * Maximum file size (50 MB)
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Weather condition enum
 */
export const weatherConditionSchema = z.enum(['SUNNY', 'CLOUDY', 'RAINY', 'SNOWY']);

/**
 * Request upload URL schema
 */
export const requestUploadUrlSchema = z.object({
  site_id: z.string().uuid(),
  angle_id: z.string().uuid(),
  file_name: z.string().min(1).max(255),
  file_type: z
    .string()
    .refine((type) => SUPPORTED_FILE_TYPES.includes(type.toLowerCase()), {
      message: `File type must be one of: ${SUPPORTED_FILE_TYPES.join(', ')}`,
    }),
  file_size: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_SIZE, `File size must not exceed ${MAX_FILE_SIZE / 1024 / 1024} MB`),
});

export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>;

/**
 * Complete upload schema
 */
export const completeUploadSchema = z.object({
  capture_id: z.string().uuid(),
  s3_key: z.string().min(1),
  capture_date: z.string().refine((date) => {
    const captureDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return captureDate <= today;
  }, {
    message: 'Capture date cannot be in the future',
  }),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  weather: weatherConditionSchema.optional(),
  notes: z.string().max(500).optional(),
});

export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;

/**
 * List captures query schema
 */
export const listCapturesQuerySchema = z.object({
  site_id: z.string().uuid().optional(),
  angle_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

export type ListCapturesQuery = z.infer<typeof listCapturesQuerySchema>;

/**
 * Validators export
 */
export const captureValidators = {
  requestUploadUrl: requestUploadUrlSchema,
  completeUpload: completeUploadSchema,
  listCapturesQuery: listCapturesQuerySchema,
};
