import { Request, Response } from 'express';
import { projectService } from '../services/project.service';
import { siteService } from '../services/site.service';
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsQuerySchema,
  createSiteSchema,
} from '../validators/project.validator';
import { z } from 'zod';

/**
 * Projects controller
 */
export class ProjectController {
  /**
   * Create a new project
   * POST /api/v1/projects
   */
  async createProject(req: Request, res: Response): Promise<void> {
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

      // Validate input
      const input = createProjectSchema.parse(req.body);

      // Create project
      const project = await projectService.createProject(input, req.user.organizationId);

      res.status(201).json({
        projectId: project.id,
        name: project.name,
        status: project.status,
        operatorOrgId: project.operatorOrgId,
        siteOwnerOrgId: project.siteOwnerOrgId,
        retentionDays: project.retentionDays,
        createdAt: project.createdAt,
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
        if (
          error.message.includes('already exists') ||
          error.message.includes('not found') ||
          error.message.includes('not a site owner')
        ) {
          res.status(400).json({
            error: {
              code: 'BAD_REQUEST',
              message: error.message,
            },
          });
          return;
        }
      }

      console.error('Create project error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create project',
        },
      });
    }
  }

  /**
   * List projects
   * GET /api/v1/projects
   */
  async listProjects(req: Request, res: Response): Promise<void> {
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

      // Validate query parameters
      const query = listProjectsQuerySchema.parse(req.query);

      // List projects
      const result = await projectService.listProjects(req.user.organizationId, query);

      res.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        });
        return;
      }

      console.error('List projects error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list projects',
        },
      });
    }
  }

  /**
   * Get project by ID
   * GET /api/v1/projects/:id
   */
  async getProject(req: Request, res: Response): Promise<void> {
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

      // Check access
      const hasAccess = await projectService.checkProjectAccess(id, req.user.organizationId);
      if (!hasAccess) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Project not found',
          },
        });
        return;
      }

      // Get project
      const project = await projectService.getProjectById(id);

      res.status(200).json(project);
    } catch (error) {
      if (error instanceof Error && error.message === 'Project not found') {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Project not found',
          },
        });
        return;
      }

      console.error('Get project error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get project',
        },
      });
    }
  }

  /**
   * Update project
   * PATCH /api/v1/projects/:id
   */
  async updateProject(req: Request, res: Response): Promise<void> {
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

      // Validate input
      const input = updateProjectSchema.parse(req.body);

      // Update project
      const project = await projectService.updateProject(id, input, req.user.organizationId);

      res.status(200).json({
        projectId: project.id,
        name: project.name,
        status: project.status,
        updatedAt: project.updatedAt,
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
        if (error.message === 'Project not found') {
          res.status(404).json({
            error: {
              code: 'NOT_FOUND',
              message: 'Project not found',
            },
          });
          return;
        }

        if (error.message.includes('Unauthorized')) {
          res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: error.message,
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

      console.error('Update project error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update project',
        },
      });
    }
  }

  /**
   * Archive project (soft delete)
   * DELETE /api/v1/projects/:id
   */
  async archiveProject(req: Request, res: Response): Promise<void> {
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

      // Archive project
      await projectService.archiveProject(id, req.user.organizationId);

      res.status(200).json({
        message: 'Project archived successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Project not found') {
          res.status(404).json({
            error: {
              code: 'NOT_FOUND',
              message: 'Project not found',
            },
          });
          return;
        }

        if (error.message.includes('Unauthorized')) {
          res.status(403).json({
            error: {
              code: 'FORBIDDEN',
              message: error.message,
            },
          });
          return;
        }
      }

      console.error('Archive project error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to archive project',
        },
      });
    }
  }

  /**
   * Create site in project
   * POST /api/v1/projects/:id/sites
   */
  async createSite(req: Request, res: Response): Promise<void> {
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

      const { id: projectId } = req.params;

      // Check project access
      const hasAccess = await projectService.checkProjectAccess(
        projectId,
        req.user.organizationId
      );
      if (!hasAccess) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Project not found',
          },
        });
        return;
      }

      // Validate input
      const input = createSiteSchema.parse(req.body);

      // Create site
      const site = await siteService.createSite(input, projectId);

      res.status(201).json({
        siteId: site.id,
        projectId: site.projectId,
        name: site.name,
        createdAt: site.createdAt,
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
        if (
          error.message === 'Project not found' ||
          error.message.includes('already exists')
        ) {
          res.status(400).json({
            error: {
              code: 'BAD_REQUEST',
              message: error.message,
            },
          });
          return;
        }
      }

      console.error('Create site error:', error);
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create site',
        },
      });
    }
  }
}

export const projectController = new ProjectController();
