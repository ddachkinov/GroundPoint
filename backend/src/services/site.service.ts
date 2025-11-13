import { PrismaClient, Site } from '@prisma/client';
import { CreateSiteInput, UpdateSiteInput } from '../validators/project.validator';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

/**
 * Site detail response
 */
export interface SiteDetailResponse {
  siteId: string;
  projectId: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  angles: Array<{
    angleId: string;
    name: string;
    imageCount: number;
  }>;
  imageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sites service
 */
class SiteService {
  /**
   * Create a new site
   */
  async createSite(input: CreateSiteInput, projectId: string): Promise<Site> {
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Check for duplicate site name within project
    const existingSite = await prisma.site.findFirst({
      where: {
        projectId,
        name: input.name,
      },
    });

    if (existingSite) {
      throw new Error('Site name already exists in this project');
    }

    // TODO: Check site quota based on subscription tier
    // For now, allow unlimited sites

    // Create site
    const site = await prisma.site.create({
      data: {
        name: input.name,
        address: input.address || null,
        latitude: input.latitude ? new Decimal(input.latitude) : null,
        longitude: input.longitude ? new Decimal(input.longitude) : null,
        description: input.description || null,
        projectId,
      },
    });

    return site;
  }

  /**
   * Get site by ID
   */
  async getSiteById(siteId: string): Promise<SiteDetailResponse> {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        angles: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!site) {
      throw new Error('Site not found');
    }

    return {
      siteId: site.id,
      projectId: site.projectId,
      name: site.name,
      address: site.address,
      latitude: site.latitude ? parseFloat(site.latitude.toString()) : null,
      longitude: site.longitude ? parseFloat(site.longitude.toString()) : null,
      description: site.description,
      angles: site.angles.map((angle) => ({
        angleId: angle.id,
        name: angle.name,
        imageCount: 0, // TODO: Implement capture count per angle
      })),
      imageCount: 0, // TODO: Implement total capture count
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
    };
  }

  /**
   * Update site
   */
  async updateSite(siteId: string, input: UpdateSiteInput): Promise<Site> {
    // Check if site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      throw new Error('Site not found');
    }

    // Check for duplicate name if updating name
    if (input.name && input.name !== site.name) {
      const existingSite = await prisma.site.findFirst({
        where: {
          projectId: site.projectId,
          name: input.name,
          id: { not: siteId },
        },
      });

      if (existingSite) {
        throw new Error('Site name already exists in this project');
      }
    }

    // Update site
    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.latitude !== undefined && {
          latitude: input.latitude ? new Decimal(input.latitude) : null,
        }),
        ...(input.longitude !== undefined && {
          longitude: input.longitude ? new Decimal(input.longitude) : null,
        }),
        ...(input.description !== undefined && { description: input.description }),
      },
    });

    return updatedSite;
  }

  /**
   * Delete site
   */
  async deleteSite(siteId: string): Promise<void> {
    // Check if site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        _count: {
          select: {
            captures: true,
          },
        },
      },
    });

    if (!site) {
      throw new Error('Site not found');
    }

    // Check if site has captures
    if (site._count.captures > 0) {
      throw new Error(
        'Cannot delete site with existing captures. Archive the project instead.'
      );
    }

    // Hard delete site
    await prisma.site.delete({
      where: { id: siteId },
    });
  }

  /**
   * Get site's project ID (for authorization)
   */
  async getSiteProjectId(siteId: string): Promise<string | null> {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { projectId: true },
    });

    return site?.projectId || null;
  }
}

export const siteService = new SiteService();
