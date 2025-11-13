import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

/**
 * Create project validation schema
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must be 200 characters or less'),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional(),
  siteOwnerOrgId: z.string().uuid('Invalid site owner organization ID'),
  retentionDays: z
    .number()
    .int()
    .min(1, 'Retention days must be at least 1')
    .max(3650, 'Retention days cannot exceed 10 years')
    .default(365),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

/**
 * Update project validation schema
 */
export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(200, 'Project name must be 200 characters or less')
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  retentionDays: z
    .number()
    .int()
    .min(1, 'Retention days must be at least 1')
    .max(3650, 'Retention days cannot exceed 10 years')
    .optional(),
  thumbnailCaptureId: z.string().uuid('Invalid capture ID').optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

/**
 * List projects query parameters
 */
export const listProjectsQuerySchema = z.object({
  status: z.nativeEnum(ProjectStatus).optional(),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

/**
 * Create site validation schema
 */
export const createSiteSchema = z.object({
  name: z
    .string()
    .min(1, 'Site name is required')
    .max(200, 'Site name must be 200 characters or less'),
  address: z.string().max(500, 'Address must be 500 characters or less').optional(),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;

/**
 * Update site validation schema
 */
export const updateSiteSchema = z.object({
  name: z
    .string()
    .min(1, 'Site name is required')
    .max(200, 'Site name must be 200 characters or less')
    .optional(),
  address: z.string().max(500, 'Address must be 500 characters or less').optional(),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .optional(),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional(),
});

export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
