import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

/**
 * Role-based access control middleware
 * @param allowedRoles - Array of roles allowed to access the endpoint
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have permission to access this resource',
          details: {
            requiredRoles: allowedRoles,
            userRole: req.user.role,
          },
        },
      });
      return;
    }

    next();
  };
}

/**
 * Require operator role (admin or member)
 */
export function requireOperator(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
      },
    });
    return;
  }

  const operatorRoles: UserRole[] = [UserRole.OPERATOR_ADMIN, UserRole.OPERATOR_MEMBER];

  if (!operatorRoles.includes(req.user.role)) {
    res.status(403).json({
      error: {
        code: 'PERMISSION_DENIED',
        message: 'Operator access required',
      },
    });
    return;
  }

  next();
}

/**
 * Require operator admin role
 */
export function requireOperatorAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
      },
    });
    return;
  }

  if (req.user.role !== UserRole.OPERATOR_ADMIN) {
    res.status(403).json({
      error: {
        code: 'PERMISSION_DENIED',
        message: 'Operator admin access required',
      },
    });
    return;
  }

  next();
}

/**
 * Require superadmin role
 */
export function requireSuperadmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
      },
    });
    return;
  }

  if (req.user.role !== UserRole.SUPERADMIN) {
    res.status(403).json({
      error: {
        code: 'PERMISSION_DENIED',
        message: 'Superadmin access required',
      },
    });
    return;
  }

  next();
}

/**
 * Check if user belongs to specific organization
 * @param getOrganizationId - Function to extract organization ID from request
 */
export function requireOrganization(
  getOrganizationId: (req: Request) => string | undefined
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Organization ID required',
        },
      });
      return;
    }

    // Superadmin can access all organizations
    if (req.user.role === UserRole.SUPERADMIN) {
      next();
      return;
    }

    if (req.user.organizationId !== organizationId) {
      res.status(403).json({
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You do not have access to this organization',
        },
      });
      return;
    }

    next();
  };
}
