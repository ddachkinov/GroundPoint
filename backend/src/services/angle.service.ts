import { Angle } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { CreateAngleInput } from '../validators/angle.validator';

/**
 * Angle service for managing capture angles
 */
class AngleService {
  /**
   * Create angle for a site
   */
  async createAngle(
    siteId: string,
    input: CreateAngleInput,
    operatorOrgId: string
  ): Promise<Angle> {
    // Verify site exists and belongs to user's organization
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        project: {
          select: {
            operatorOrgId: true,
          },
        },
      },
    });

    if (!site) {
      throw new Error('Site not found');
    }

    if (site.project.operatorOrgId !== operatorOrgId) {
      throw new Error('Access denied');
    }

    // Check for duplicate name within site
    const existingAngle = await prisma.angle.findFirst({
      where: {
        siteId,
        name: input.name,
      },
    });

    if (existingAngle) {
      throw new Error('An angle with this name already exists for this site');
    }

    // Get current max sort order
    const maxSortOrder = await prisma.angle.findFirst({
      where: { siteId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const sortOrder = maxSortOrder ? maxSortOrder.sortOrder + 1 : 0;

    // Create angle
    const angle = await prisma.angle.create({
      data: {
        siteId,
        name: input.name,
        description: input.description,
        sortOrder,
      },
    });

    return angle;
  }

  /**
   * List angles for a site
   */
  async listAngles(siteId: string, operatorOrgId: string): Promise<Angle[]> {
    // Verify site exists and belongs to user's organization
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        project: {
          select: {
            operatorOrgId: true,
          },
        },
      },
    });

    if (!site) {
      throw new Error('Site not found');
    }

    if (site.project.operatorOrgId !== operatorOrgId) {
      throw new Error('Access denied');
    }

    // Get angles ordered by sort order
    const angles = await prisma.angle.findMany({
      where: { siteId },
      orderBy: { sortOrder: 'asc' },
    });

    return angles;
  }
}

export const angleService = new AngleService();
