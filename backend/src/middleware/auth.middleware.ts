import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

/**
 * Auth middleware to validate JWT tokens
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authorization token required',
        },
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyToken(token);

    // Check token type
    if (payload.type !== 'access') {
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type. Access token required.',
        },
      });
      return;
    }

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Token expired') {
        res.status(401).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Access token has expired',
          },
        });
        return;
      }

      if (error.message === 'Invalid token') {
        res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid access token',
          },
        });
        return;
      }
    }

    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
      },
    });
  }
}

/**
 * Optional auth middleware (doesn't fail if no token provided)
 * Useful for endpoints that work differently for authenticated vs anonymous users
 */
export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without auth
      next();
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (payload.type === 'access') {
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        organizationId: payload.organizationId,
      };
    }

    next();
  } catch (error) {
    // Token is invalid, but since auth is optional, continue without auth
    next();
  }
}
