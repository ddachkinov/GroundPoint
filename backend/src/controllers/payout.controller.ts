import { Request, Response } from 'express';
import { payoutService } from '../services/payout.service';
import { PayoutStatus } from '@prisma/client';

export class PayoutController {
  /**
   * POST /api/v1/operators/connect-account
   * Create or retrieve Stripe Connect account
   */
  async createConnectAccount(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Only operators can connect accounts' });
        return;
      }

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const refreshUrl = `${baseUrl}/payouts/setup`;
      const returnUrl = `${baseUrl}/payouts/setup/complete`;

      const result = await payoutService.createConnectAccount(
        operatorOrgId,
        refreshUrl,
        returnUrl
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error creating connect account:', error);
      res.status(500).json({ error: 'Failed to create connect account' });
    }
  }

  /**
   * GET /api/v1/operators/connect-account/status
   * Get Connect account status
   */
  async getConnectAccountStatus(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Only operators can view connect account status' });
        return;
      }

      const status = await payoutService.getConnectAccountStatus(operatorOrgId);

      res.json(status);
    } catch (error: any) {
      console.error('Error getting connect account status:', error);
      res.status(500).json({ error: 'Failed to get connect account status' });
    }
  }

  /**
   * GET /api/v1/payouts
   * List payouts for operator
   */
  async listPayouts(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Only operators can view payouts' });
        return;
      }

      const filters = {
        status: req.query.status as PayoutStatus | undefined,
        date_from: req.query.date_from as string | undefined,
        date_to: req.query.date_to as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      };

      const result = await payoutService.listPayouts(operatorOrgId, filters);

      res.json(result);
    } catch (error: any) {
      console.error('Error listing payouts:', error);
      res.status(500).json({ error: 'Failed to list payouts' });
    }
  }

  /**
   * GET /api/v1/payouts/:id
   * Get single payout details
   */
  async getPayout(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Only operators can view payouts' });
        return;
      }

      const payout = await payoutService.getPayout(req.params.id, operatorOrgId);

      res.json(payout);
    } catch (error: any) {
      console.error('Error getting payout:', error);

      if (error.message === 'Payout not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message === 'Not authorized to view this payout') {
        res.status(403).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Failed to get payout' });
    }
  }

  /**
   * GET /api/v1/payouts/dashboard
   * Get payout dashboard metrics
   */
  async getDashboardMetrics(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Only operators can view dashboard metrics' });
        return;
      }

      const metrics = await payoutService.getDashboardMetrics(operatorOrgId);

      res.json(metrics);
    } catch (error: any) {
      console.error('Error getting dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to get dashboard metrics' });
    }
  }

  /**
   * POST /api/v1/payouts/:id/process
   * Manually process a pending payout (admin only)
   */
  async processPayout(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Add admin role check
      const userRole = req.user?.role;

      if (userRole !== 'SUPERADMIN') {
        res.status(403).json({ error: 'Only superadmins can process payouts manually' });
        return;
      }

      await payoutService.processPayout(req.params.id);

      res.json({ message: 'Payout processed successfully' });
    } catch (error: any) {
      console.error('Error processing payout:', error);

      if (error.message === 'Payout not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message === 'Payout is not in PENDING status') {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Failed to process payout' });
    }
  }
}

export const payoutController = new PayoutController();
