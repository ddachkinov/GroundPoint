import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
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
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authorization token required' },
      });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (payload.type !== 'access') {
      res.status(401).json({
        error: { code: 'INVALID_TOKEN_TYPE', message: 'Invalid token type. Access token required.' },
      });
      return;
    }

    const role = payload.role as UserRole;
    const isOperator = role === UserRole.OPERATOR_ADMIN || role === UserRole.OPERATOR_MEMBER;
    const isSiteOwner = role === UserRole.SITE_OWNER;

    req.user = {
      userId: payload.userId,
      id: payload.userId,
      email: payload.email,
      role,
      organizationId: payload.organizationId,
      operatorOrganizationId: isOperator ? payload.organizationId : undefined,
      siteOwnerOrganizationId: isSiteOwner ? payload.organizationId : undefined,
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Token expired') {
        res.status(401).json({ error: { code: 'TOKEN_EXPIRED', message: 'Access token has expired' } });
        return;
      }
      if (error.message === 'Invalid token') {
        res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid access token' } });
        return;
      }
    }
    res.status(401).json({ error: { code: 'AUTHENTICATION_FAILED', message: 'Authentication failed' } });
  }
}

/** Alias used by later-milestone routes */
export const authenticateToken = authMiddleware;

/**
 * Optional auth middleware (doesn't fail if no token provided)
 */
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload.type === 'access') {
      const role = payload.role as UserRole;
      const isOperator = role === UserRole.OPERATOR_ADMIN || role === UserRole.OPERATOR_MEMBER;
      const isSiteOwner = role === UserRole.SITE_OWNER;
      req.user = {
        userId: payload.userId,
        id: payload.userId,
        email: payload.email,
        role,
        organizationId: payload.organizationId,
        operatorOrganizationId: isOperator ? payload.organizationId : undefined,
        siteOwnerOrganizationId: isSiteOwner ? payload.organizationId : undefined,
      };
    }
    next();
  } catch {
    next();
  }
}
