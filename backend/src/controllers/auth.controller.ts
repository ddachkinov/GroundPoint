import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  emailVerificationSchema,
  refreshTokenSchema,
} from '../validators/auth.validator';
import { z } from 'zod';

/**
 * Auth controller
 */
export class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const input = registerSchema.parse(req.body);

      // Register user
      const result = await authService.register(input);

      res.status(201).json({
        userId: result.userId,
        email: input.email,
        organizationId: result.organizationId,
        message: 'Verification email sent. Please check your inbox.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
        return;
      }

      if (error instanceof Error) {
        if (error.message === 'Email already registered') {
          res.status(400).json({
            error: {
              code: 'EMAIL_EXISTS',
              message: 'Email already registered',
            },
          });
          return;
        }

        if (error.message.startsWith('Password validation failed')) {
          res.status(400).json({
            error: {
              code: 'WEAK_PASSWORD',
              message: error.message,
            },
          });
          return;
        }
      }

      console.error('Registration error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Registration failed. Please try again.',
        },
      });
    }
  }

  /**
   * Verify email address
   * POST /api/v1/auth/verify-email
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = emailVerificationSchema.parse(req.body);

      await authService.verifyEmail(token);

      res.status(200).json({
        message: 'Email verified successfully. You can now log in.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
        return;
      }

      if (error instanceof Error && error.message === 'Invalid or expired verification token') {
        res.status(400).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired verification token',
          },
        });
        return;
      }

      console.error('Email verification error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Email verification failed. Please try again.',
        },
      });
    }
  }

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const input = loginSchema.parse(req.body);

      const result = await authService.login(input);

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: input.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
        return;
      }

      if (error instanceof Error) {
        if (error.message === 'Invalid credentials') {
          res.status(401).json({
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            },
          });
          return;
        }

        if (error.message === 'Email not verified. Please check your inbox.') {
          res.status(403).json({
            error: {
              code: 'EMAIL_NOT_VERIFIED',
              message: 'Email not verified. Please check your inbox.',
            },
          });
          return;
        }

        if (error.message === 'MFA code required') {
          res.status(200).json({
            mfaRequired: true,
            message: 'MFA code required',
          });
          return;
        }
      }

      console.error('Login error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Login failed. Please try again.',
        },
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          error: {
            code: 'REFRESH_TOKEN_REQUIRED',
            message: 'Refresh token required',
          },
        });
        return;
      }

      const result = await authService.refreshAccessToken(refreshToken);

      res.status(200).json({
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('refresh token')) {
        res.status(401).json({
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: error.message,
          },
        });
        return;
      }

      console.error('Token refresh error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Token refresh failed. Please log in again.',
        },
      });
    }
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Logout failed. Please try again.',
        },
      });
    }
  }

  /**
   * Request password reset
   * POST /api/v1/auth/password-reset
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = passwordResetRequestSchema.parse(req.body);

      await authService.requestPasswordReset(email);

      // Always return success to prevent email enumeration
      res.status(200).json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
        return;
      }

      console.error('Password reset request error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Password reset request failed. Please try again.',
        },
      });
    }
  }

  /**
   * Confirm password reset
   * POST /api/v1/auth/password-reset/confirm
   */
  async confirmPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = passwordResetConfirmSchema.parse(req.body);

      await authService.resetPassword(token, newPassword);

      res.status(200).json({
        message: 'Password reset successful. You can now log in with your new password.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        });
        return;
      }

      if (error instanceof Error) {
        if (error.message === 'Invalid or expired reset token') {
          res.status(400).json({
            error: {
              code: 'INVALID_TOKEN',
              message: 'Invalid or expired reset token. Please request a new one.',
            },
          });
          return;
        }

        if (error.message.startsWith('Password validation failed')) {
          res.status(400).json({
            error: {
              code: 'WEAK_PASSWORD',
              message: error.message,
            },
          });
          return;
        }
      }

      console.error('Password reset confirmation error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Password reset failed. Please try again.',
        },
      });
    }
  }

  /**
   * Get current user info
   * GET /api/v1/auth/me
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        });
        return;
      }

      res.status(200).json({
        user: req.user,
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user information',
        },
      });
    }
  }
}

export const authController = new AuthController();
