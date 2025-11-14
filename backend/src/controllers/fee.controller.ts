import { Request, Response } from 'express';
import { feeService } from '../services/fee.service';

export class FeeController {
  /**
   * GET /api/v1/fees
   * List fees for operator organization
   */
  async listFees(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Only operators can view fees' });
        return;
      }

      const filters = {
        paymentId: req.query.payment_id as string | undefined,
        dateFrom: req.query.date_from as string | undefined,
        dateTo: req.query.date_to as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      };

      const result = await feeService.listFees(operatorOrgId, filters);

      res.json(result);
    } catch (error: any) {
      console.error('Error listing fees:', error);
      res.status(500).json({ error: 'Failed to list fees' });
    }
  }

  /**
   * GET /api/v1/fees/summary
   * Get monthly fee summary for operator
   */
  async getFeeSummary(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Only operators can view fee summaries' });
        return;
      }

      // Default to current month if not specified
      let month = req.query.month as string;
      if (!month) {
        const now = new Date();
        month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      }

      // Validate month format (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(month)) {
        res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
        return;
      }

      const summary = await feeService.getMonthlyFeeSummary(operatorOrgId, month);

      res.json(summary);
    } catch (error: any) {
      console.error('Error getting fee summary:', error);
      res.status(500).json({ error: 'Failed to get fee summary' });
    }
  }

  /**
   * GET /api/v1/fees/payment/:paymentId
   * Get fee breakdown for a specific payment
   */
  async getPaymentFees(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Only operators can view payment fees' });
        return;
      }

      const fees = await feeService.getPaymentFees(req.params.paymentId);

      res.json({ fees });
    } catch (error: any) {
      console.error('Error getting payment fees:', error);
      res.status(500).json({ error: 'Failed to get payment fees' });
    }
  }

  /**
   * GET /api/v1/fees/payout/:payoutId/breakdown
   * Get fee breakdown for a payout
   */
  async getPayoutFeeBreakdown(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Only operators can view payout fee breakdowns' });
        return;
      }

      const breakdown = await feeService.getPayoutFeeBreakdown(req.params.payoutId);

      res.json(breakdown);
    } catch (error: any) {
      console.error('Error getting payout fee breakdown:', error);

      if (error.message === 'Payout not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Failed to get payout fee breakdown' });
    }
  }

  /**
   * GET /api/v1/admin/fees/reconciliation
   * Get reconciliation report (Superadmin only)
   */
  async getReconciliationReport(req: Request, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;

      if (userRole !== 'SUPERADMIN') {
        res.status(403).json({ error: 'Only superadmins can view reconciliation reports' });
        return;
      }

      const dateFrom = req.query.date_from as string;
      const dateTo = req.query.date_to as string;

      if (!dateFrom || !dateTo) {
        res.status(400).json({ error: 'Both date_from and date_to are required' });
        return;
      }

      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
        res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        return;
      }

      const report = await feeService.getReconciliationReport(dateFrom, dateTo);

      res.json(report);
    } catch (error: any) {
      console.error('Error getting reconciliation report:', error);
      res.status(500).json({ error: 'Failed to get reconciliation report' });
    }
  }
}

export const feeController = new FeeController();
