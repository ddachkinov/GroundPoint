import { Request, Response } from 'express';
import { siteService } from '../services/site.service';
import { projectService } from '../services/project.service';
import { updateSiteSchema } from '../validators/project.validator';
import { z } from 'zod';

/**
 * Sites controller
 */
export class SiteController {
  /**
   * Get site by ID
   * GET /api/v1/sites/:id
   */
  async getSite(req: Request, res: Response): Promise<void> {
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

      const { id } = req.params;

      // Get site's project ID
      const projectId = await siteService.getSiteProjectId(id);
      if (!projectId) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Site not found',
          },
        });
        return;
      }

      // Check project access
      const hasAccess = await projectService.checkProjectAccess(
        projectId,
        req.user.organizationId
      );
      if (!hasAccess) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Site not found',
          },
        });
        return;
      }

      // Get site
      const site = await siteService.getSiteById(id);

      res.status(200).json(site);
    } catch (error) {
      if (error instanceof Error && error.message === 'Site not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Site not found',
          },
        });
        return;
      }

      console.error('Get site error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get site',
        },
      });
    }
  }

  /**
   * Update site
   * PATCH /api/v1/sites/:id
   */
  async updateSite(req: Request, res: Response): Promise<void> {
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

      const { id } = req.params;

      // Get site's project ID
      const projectId = await siteService.getSiteProjectId(id);
      if (!projectId) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Site not found',
          },
        });
        return;
      }

      // Check project access
      const hasAccess = await projectService.checkProjectAccess(
        projectId,
        req.user.organizationId
      );
      if (!hasAccess) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this site',
          },
        });
        return;
      }

      // Validate input
      const input = updateSiteSchema.parse(req.body);

      // Update site
      const site = await siteService.updateSite(id, input);

      res.status(200).json({
        siteId: site.id,
        name: site.name,
        updatedAt: site.updatedAt,
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
        if (error.message === 'Site not found') {
          res.status(404).json({
            error: {
              code: 'NOT_FOUND',
              message: 'Site not found',
            },
          });
          return;
        }

        if (error.message.includes('already exists')) {
          res.status(400).json({
            error: {
              code: 'BAD_REQUEST',
              message: error.message,
            },
          });
          return;
        }
      }

      console.error('Update site error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update site',
        },
      });
    }
  }

  /**
   * Delete site
   * DELETE /api/v1/sites/:id
   */
  async deleteSite(req: Request, res: Response): Promise<void> {
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

      const { id } = req.params;

      // Get site's project ID
      const projectId = await siteService.getSiteProjectId(id);
      if (!projectId) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Site not found',
          },
        });
        return;
      }

      // Check project access
      const hasAccess = await projectService.checkProjectAccess(
        projectId,
        req.user.organizationId
      );
      if (!hasAccess) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this site',
          },
        });
        return;
      }

      // Delete site
      await siteService.deleteSite(id);

      res.status(200).json({
        message: 'Site deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Site not found') {
          res.status(404).json({
            error: {
              code: 'NOT_FOUND',
              message: 'Site not found',
            },
          });
          return;
        }

        if (error.message.includes('Cannot delete site')) {
          res.status(400).json({
            error: {
              code: 'BAD_REQUEST',
              message: error.message,
            },
          });
          return;
        }
      }

      console.error('Delete site error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete site',
        },
      });
    }
  }
}

export const siteController = new SiteController();
