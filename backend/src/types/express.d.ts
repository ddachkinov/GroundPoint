import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        id: string; // alias for userId
        email: string;
        role: UserRole;
        organizationId: string;
        operatorOrganizationId?: string;  // set when role is OPERATOR_ADMIN or OPERATOR_MEMBER
        siteOwnerOrganizationId?: string; // set when role is SITE_OWNER
      };
    }
  }
}

export {};
