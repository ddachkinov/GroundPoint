import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/**
 * JWT token payload
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string;
  type: 'access' | 'refresh';
}

/**
 * Token expiration times
 */
const TOKEN_EXPIRATION = {
  access: '15m', // 15 minutes
  refresh: '7d', // 7 days
  refreshExtended: '30d', // 30 days for "remember me"
};

/**
 * Generate an access token
 * @param payload - Token payload
 * @returns Signed JWT token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
  return jwt.sign(
    {
      ...payload,
      type: 'access',
    },
    env.JWT_SECRET,
    {
      expiresIn: TOKEN_EXPIRATION.access as any,
      algorithm: 'HS256',
    }
  );
}

/**
 * Generate a refresh token
 * @param payload - Token payload
 * @param rememberMe - Whether to extend expiration (30 days instead of 7)
 * @returns Signed JWT token
 */
export function generateRefreshToken(
  payload: Omit<JWTPayload, 'type'>,
  rememberMe: boolean = false
): string {
  return jwt.sign(
    {
      ...payload,
      type: 'refresh',
    },
    env.JWT_SECRET,
    {
      expiresIn: (rememberMe ? TOKEN_EXPIRATION.refreshExtended : TOKEN_EXPIRATION.refresh) as any,
      algorithm: 'HS256',
    }
  );
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Decode a token without verifying (useful for inspecting expired tokens)
 * @param token - JWT token to decode
 * @returns Decoded token payload or null if invalid
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Get token expiration time in seconds
 * @param type - Token type
 * @param rememberMe - Whether using extended refresh token
 * @returns Expiration time in seconds
 */
export function getTokenExpiration(
  type: 'access' | 'refresh',
  rememberMe: boolean = false
): number {
  if (type === 'access') {
    return 15 * 60; // 15 minutes
  }
  return rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 or 7 days
}
