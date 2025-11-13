import { z } from 'zod';
import { OrganizationType } from '@prisma/client';

/**
 * Email validation schema
 */
const emailSchema = z
  .string()
  .email('Invalid email address')
  .transform((email) => email.toLowerCase());

/**
 * Password validation schema
 */
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Password must contain at least one special character'
  );

/**
 * Registration validation schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name too long'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name too long'),
  organizationName: z
    .string()
    .min(1, 'Organization name is required')
    .max(200, 'Organization name too long'),
  organizationType: z.nativeEnum(OrganizationType, {
    errorMap: () => ({ message: 'Organization type must be OPERATOR or SITE_OWNER' }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  mfaCode: z.string().regex(/^\d{6}$/, 'MFA code must be 6 digits').optional(),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Password reset request validation schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password reset confirm validation schema
 */
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});

export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;

/**
 * Email verification validation schema
 */
export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>;

/**
 * Refresh token validation schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * MFA enable validation schema
 */
export const mfaEnableSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'MFA code must be 6 digits'),
});

export type MFAEnableInput = z.infer<typeof mfaEnableSchema>;

/**
 * Validate request body against schema
 */
export function validate<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    return schema.parse(data);
  };
}
