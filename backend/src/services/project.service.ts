import { PrismaClient, Project, ProjectStatus, OrganizationType } from '@prisma/client';
import {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsQuery,
} from '../validators/project.validator';

const prisma = new PrismaClient();

/**
 * Project list response
 */
export interface ProjectListItem {
  projectId: string;
  name: string;
  status: ProjectStatus;
  siteOwnerOrgName: string;
  siteCount: number;
  imageCount: number;
  thumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project list response with pagination
 */
export interface ProjectListResponse {
  projects: ProjectListItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Project detail response
 */
export interface ProjectDetailResponse {
  projectId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  operatorOrgId: string;
  operatorOrgName: string;
  siteOwnerOrgId: string;
  siteOwnerOrgName: string;
  retentionDays: number;
  thumbnailCaptureId: string | null;
  sites: Array<{
    siteId: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    imageCount: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Projects service
 */
class ProjectService {
  /**
   * Create a new project
   */
  async createProject(
    input: CreateProjectInput,
    operatorOrgId: string
  ): Promise<Project> {
    // Check if site owner organization exists and is of type SITE_OWNER
    const siteOwnerOrg = await prisma.organization.findUnique({
      where: { id: input.siteOwnerOrgId },
    });

    if (!siteOwnerOrg) {
      throw new Error('Site owner organization not found');
    }

    if (siteOwnerOrg.type !== OrganizationType.SITE_OWNER) {
      throw new Error('Selected organization is not a site owner');
    }

    // Check for duplicate project name within operator organization
    const existingProject = await prisma.project.findFirst({
      where: {
        operatorOrgId,
        name: input.name,
        status: { not: ProjectStatus.ARCHIVED },
      },
    });

    if (existingProject) {
      throw new Error('Project name already exists in your organization');
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name: input.name,
        description: input.description || null,
        operatorOrgId,
        siteOwnerOrgId: input.siteOwnerOrgId,
        status: ProjectStatus.ACTIVE,
        retentionDays: input.retentionDays,
      },
    });

    return project;
  }

  /**
   * List projects for an organization
   */
  async listProjects(
    operatorOrgId: string,
    query: ListProjectsQuery
  ): Promise<ProjectListResponse> {
    const { status, search, limit, offset } = query;

    // Build where clause
    const where: any = {
      operatorOrgId,
    };

    if (status) {
      where.status = status;
    } else {
      // By default, exclude archived projects
      where.status = { not: ProjectStatus.ARCHIVED };
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Get total count
    const total = await prisma.project.count({ where });

    // Get projects with related data
    const projects = await prisma.project.findMany({
      where,
      include: {
        siteOwnerOrg: {
          select: { name: true },
        },
        sites: {
          select: { id: true },
        },
        _count: {
          select: {
            sites: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Map to response format
    const projectList: ProjectListItem[] = projects.map((project) => ({
      projectId: project.id,
      name: project.name,
      status: project.status,
      siteOwnerOrgName: project.siteOwnerOrg.name,
      siteCount: project._count.sites,
      imageCount: 0, // TODO: Implement capture count aggregation
      thumbnailUrl: null, // TODO: Implement thumbnail URL generation
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    return {
      projects: projectList,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId: string): Promise<ProjectDetailResponse> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        operatorOrg: {
          select: { name: true },
        },
        siteOwnerOrg: {
          select: { name: true },
        },
        sites: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return {
      projectId: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      operatorOrgId: project.operatorOrgId,
      operatorOrgName: project.operatorOrg.name,
      siteOwnerOrgId: project.siteOwnerOrgId,
      siteOwnerOrgName: project.siteOwnerOrg.name,
      retentionDays: project.retentionDays,
      thumbnailCaptureId: project.thumbnailCaptureId,
      sites: project.sites.map((site) => ({
        siteId: site.id,
        name: site.name,
        address: site.address,
        latitude: site.latitude ? parseFloat(site.latitude.toString()) : null,
        longitude: site.longitude ? parseFloat(site.longitude.toString()) : null,
        imageCount: 0, // TODO: Implement capture count
      })),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    input: UpdateProjectInput,
    operatorOrgId: string
  ): Promise<Project> {
    // Check if project exists and belongs to operator
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.operatorOrgId !== operatorOrgId) {
      throw new Error('Unauthorized: Project does not belong to your organization');
    }

    // Check for duplicate name if updating name
    if (input.name && input.name !== project.name) {
      const existingProject = await prisma.project.findFirst({
        where: {
          operatorOrgId,
          name: input.name,
          status: { not: ProjectStatus.ARCHIVED },
          id: { not: projectId },
        },
      });

      if (existingProject) {
        throw new Error('Project name already exists in your organization');
      }
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status && { status: input.status }),
        ...(input.retentionDays && { retentionDays: input.retentionDays }),
        ...(input.thumbnailCaptureId !== undefined && {
          thumbnailCaptureId: input.thumbnailCaptureId,
        }),
      },
    });

    return updatedProject;
  }

  /**
   * Archive project (soft delete)
   */
  async archiveProject(projectId: string, operatorOrgId: string): Promise<void> {
    // Check if project exists and belongs to operator
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        sites: true,
        invoices: true,
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (project.operatorOrgId !== operatorOrgId) {
      throw new Error('Unauthorized: Project does not belong to your organization');
    }

    // Soft delete by setting status to ARCHIVED
    await prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.ARCHIVED },
    });
  }

  /**
   * Check if user has access to project
   */
  async checkProjectAccess(projectId: string, organizationId: string): Promise<boolean> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return false;
    }

    // User has access if they're in the operator or site owner organization
    return (
      project.operatorOrgId === organizationId ||
      project.siteOwnerOrgId === organizationId
    );
  }
}

export const projectService = new ProjectService();
