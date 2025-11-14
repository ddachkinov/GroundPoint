import { Request, Response } from 'express';
import { invoiceService } from '../services/invoice.service';
import { InvoiceStatus } from '@prisma/client';

export class InvoiceController {
  /**
   * POST /api/v1/invoices
   * Create a new draft invoice
   */
  async createInvoice(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Only operators can create invoices' });
        return;
      }

      const invoice = await invoiceService.createInvoice(operatorOrgId, req.body);

      res.status(201).json(invoice);
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      res.status(400).json({ error: error.message || 'Failed to create invoice' });
    }
  }

  /**
   * GET /api/v1/invoices
   * List invoices with filtering
   */
  async listInvoices(req: Request, res: Response): Promise<void> {
    try {
      const userOrgId = req.user?.operatorOrganizationId || req.user?.siteOwnerOrganizationId;
      const isOperator = !!req.user?.operatorOrganizationId;

      if (!userOrgId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const filters = {
        status: req.query.status as InvoiceStatus | undefined,
        project_id: req.query.project_id as string | undefined,
        date_from: req.query.date_from as string | undefined,
        date_to: req.query.date_to as string | undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
      };

      const result = await invoiceService.listInvoices(userOrgId, isOperator, filters);

      res.json(result);
    } catch (error: any) {
      console.error('Error listing invoices:', error);
      res.status(500).json({ error: 'Failed to list invoices' });
    }
  }

  /**
   * GET /api/v1/invoices/:id
   * Get single invoice details
   */
  async getInvoice(req: Request, res: Response): Promise<void> {
    try {
      const userOrgId = req.user?.operatorOrganizationId || req.user?.siteOwnerOrganizationId;

      if (!userOrgId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const invoice = await invoiceService.getInvoice(req.params.id, userOrgId);

      res.json(invoice);
    } catch (error: any) {
      console.error('Error getting invoice:', error);
      if (error.message === 'Invoice not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Not authorized to view this invoice') {
        res.status(403).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to get invoice' });
      }
    }
  }

  /**
   * PATCH /api/v1/invoices/:id
   * Update an existing draft invoice
   */
  async updateInvoice(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Only operators can update invoices' });
        return;
      }

      const invoice = await invoiceService.updateInvoice(
        req.params.id,
        operatorOrgId,
        req.body
      );

      res.json(invoice);
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      if (error.message === 'Invoice not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Only draft invoices can be edited') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message || 'Failed to update invoice' });
      }
    }
  }

  /**
   * POST /api/v1/invoices/:id/send
   * Send invoice to client
   */
  async sendInvoice(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Only operators can send invoices' });
        return;
      }

      const result = await invoiceService.sendInvoice(req.params.id, operatorOrgId);

      res.json(result);
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      if (error.message === 'Invoice not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Only draft invoices can be sent') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to send invoice' });
      }
    }
  }

  /**
   * POST /api/v1/invoices/:id/cancel
   * Cancel an invoice
   */
  async cancelInvoice(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Only operators can cancel invoices' });
        return;
      }

      const { reason } = req.body;
      const result = await invoiceService.cancelInvoice(req.params.id, operatorOrgId, reason);

      res.json(result);
    } catch (error: any) {
      console.error('Error cancelling invoice:', error);
      if (error.message === 'Invoice not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Cannot cancel a paid invoice') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to cancel invoice' });
      }
    }
  }

  /**
   * DELETE /api/v1/invoices/:id
   * Delete a draft invoice
   */
  async deleteInvoice(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Only operators can delete invoices' });
        return;
      }

      await invoiceService.deleteInvoice(req.params.id, operatorOrgId);

      res.json({ message: 'Invoice deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      if (error.message === 'Invoice not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Only draft invoices can be deleted') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete invoice' });
      }
    }
  }

  /**
   * GET /api/v1/invoices/dashboard
   * Get dashboard metrics for operator
   */
  async getDashboardMetrics(req: Request, res: Response): Promise<void> {
    try {
      const operatorOrgId = req.user?.operatorOrganizationId;

      if (!operatorOrgId) {
        res.status(403).json({ error: 'Only operators can view dashboard metrics' });
        return;
      }

      const metrics = await invoiceService.getDashboardMetrics(operatorOrgId);

      res.json(metrics);
    } catch (error: any) {
      console.error('Error getting dashboard metrics:', error);
      res.status(500).json({ error: 'Failed to get dashboard metrics' });
    }
  }

  /**
   * GET /api/v1/invoices/:id/pdf
   * Download invoice as PDF
   * Note: PDF generation implementation placeholder
   */
  async downloadInvoicePDF(req: Request, res: Response): Promise<void> {
    try {
      const userOrgId = req.user?.operatorOrganizationId || req.user?.siteOwnerOrganizationId;

      if (!userOrgId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const invoice = await invoiceService.getInvoice(req.params.id, userOrgId);

      // TODO: Implement PDF generation with Puppeteer or PDFKit
      // For now, return a placeholder message
      res.status(501).json({
        error: 'PDF generation not yet implemented',
        invoice_number: invoice.invoice_number,
      });
    } catch (error: any) {
      console.error('Error downloading invoice PDF:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
}

export const invoiceController = new InvoiceController();
