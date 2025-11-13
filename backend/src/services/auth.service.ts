import { PrismaClient, User, Organization, UserRole, OrganizationType } from '@prisma/client';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  JWTPayload,
} from '../utils/jwt';
import {
  generateVerificationToken,
  generatePasswordResetToken,
  hashToken,
  verifyTokenHash,
} from '../utils/tokens';
import { emailService } from './email.service';
import { redis } from '../config/redis';

const prisma = new PrismaClient();

/**
 * Registration input
 */
export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationType: OrganizationType;
}

/**
 * Login input
 */
export interface LoginInput {
  email: string;
  password: string;
  mfaCode?: string;
  rememberMe?: boolean;
}

/**
 * Auth tokens response
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    organizationId: string;
    emailVerified: boolean;
  };
}

/**
 * Authentication service
 */
class AuthService {
  /**
   * Register a new user and organization
   */
  async register(input: RegisterInput): Promise<{ userId: string; organizationId: string }> {
    const { email, password, firstName, lastName, organizationName, organizationType } = input;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenHash = hashToken(verificationToken);

    // Create organization and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          type: organizationType,
          countryCode: 'US', // TODO: Get from user input or IP geolocation
        },
      });

      // Determine user role based on organization type
      const role = organizationType === 'OPERATOR' ? UserRole.OPERATOR_ADMIN : UserRole.SITE_OWNER;

      // Create user
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          firstName,
          lastName,
          role,
          organizationId: organization.id,
          emailVerified: false,
          mfaEnabled: false,
          emailVerificationToken: verificationTokenHash,
          emailVerificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      return { user, organization };
    });

    // Send verification email
    await emailService.sendVerificationEmail(
      email,
      firstName,
      verificationToken
    );

    return {
      userId: result.user.id,
      organizationId: result.organization.id,
    };
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    const tokenHash = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: tokenHash,
        emailVerificationTokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      },
    });

    // Send welcome email
    if (user.role === UserRole.OPERATOR_ADMIN) {
      await emailService.sendWelcomeOperatorEmail(user.email, user.firstName);
    }
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthTokens> {
    const { email, password, mfaCode, rememberMe = false } = input;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const passwordValid = await comparePassword(password, user.passwordHash);
    if (!passwordValid) {
      throw new Error('Invalid credentials');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new Error('Email not verified. Please check your inbox.');
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaCode) {
        throw new Error('MFA code required');
      }

      // TODO: Implement MFA verification
      // For now, we'll skip MFA implementation
      throw new Error('MFA not yet implemented');
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload, rememberMe);

    // Store refresh token in database (for revocation tracking)
    await prisma.refreshToken.create({
      data: {
        token: hashToken(refreshToken),
        userId: user.id,
        expiresAt: new Date(
          Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000
        ),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    // Verify refresh token
    let payload: JWTPayload;
    try {
      payload = verifyToken(refreshToken);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Check if token is blacklisted (revoked)
    const tokenHash = hashToken(refreshToken);
    const isBlacklisted = await redis.get(`blacklist:${tokenHash}`);
    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!storedToken) {
      throw new Error('Refresh token not found or expired');
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
    });

    return {
      accessToken,
      expiresIn: 900, // 15 minutes
    };
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);

    // Add to blacklist in Redis (TTL = token expiration)
    await redis.setex(`blacklist:${tokenHash}`, 7 * 24 * 60 * 60, '1');

    // Delete from database
    await prisma.refreshToken.deleteMany({
      where: { token: tokenHash },
    });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return;
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken();
    const resetTokenHash = hashToken(resetToken);

    // Store reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetTokenHash,
        passwordResetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send reset email
    await emailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetToken
    );
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Validate new password
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    const tokenHash = hashToken(token);

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetTokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      },
    });

    // Revoke all existing refresh tokens (force re-login everywhere)
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });
  }
}

export const authService = new AuthService();
