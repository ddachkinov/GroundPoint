import { z } from 'zod';

/**
 * Create angle schema
 */
export const createAngleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export type CreateAngleInput = z.infer<typeof createAngleSchema>;
