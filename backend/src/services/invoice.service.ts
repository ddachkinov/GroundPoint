import { PrismaClient, InvoiceStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface CreateInvoiceData {
  site_owner_org_id: string;
  project_id?: string;
  issue_date: string;
  due_date: string;
  currency: string;
  notes?: string;
  payment_terms?: string;
  line_items: LineItem[];
}

interface UpdateInvoiceData extends Partial<CreateInvoiceData> {}

interface InvoiceFilters {
  status?: InvoiceStatus;
  project_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class InvoiceService {
  /**
   * Generate next invoice number for operator organization
   */
  private async generateInvoiceNumber(operatorOrgId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `OP-${year}-`;

    // Get the latest invoice number for this operator and year
    const latestInvoice = await prisma.invoice.findFirst({
      where: {
        operatorOrgId,
        invoiceNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
    });

    let nextNumber = 1;
    if (latestInvoice) {
      // Extract number from format OP-YYYY-####
      const match = latestInvoice.invoiceNumber.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format with leading zeros (e.g., 0001)
    const paddedNumber = nextNumber.toString().padStart(4, '0');
    return `${prefix}${paddedNumber}`;
  }

  /**
   * Calculate tax rate based on operator and site owner locations
   * Note: Simplified version. In production, integrate with Stripe Tax or similar service
   */
  private async calculateTaxRate(
    operatorOrgId: string,
    siteOwnerOrgId: string
  ): Promise<number> {
    // TODO: Implement proper tax calculation based on locations
    // For now, return a default rate of 8.5%
    // In production, this would:
    // 1. Fetch organization addresses
    // 2. Determine tax jurisdiction
    // 3. Apply appropriate sales tax / VAT rate
    return 8.5;
  }

  /**
   * Create a new draft invoice
   */
  async createInvoice(
    operatorOrgId: string,
    data: CreateInvoiceData
  ): Promise<any> {
    // Validate dates
    const issueDate = new Date(data.issue_date);
    const dueDate = new Date(data.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (issueDate > today) {
      throw new Error('Issue date cannot be in the future');
    }

    if (dueDate <= issueDate) {
      throw new Error('Due date must be after issue date');
    }

    // Validate line items
    if (!data.line_items || data.line_items.length === 0) {
      throw new Error('At least one line item is required');
    }

    for (const item of data.line_items) {
      if (!item.description) {
        throw new Error('Line item description is required');
      }
      if (item.quantity <= 0) {
        throw new Error('Line item quantity must be positive');
      }
      if (item.unit_price < 0) {
        throw new Error('Line item unit price must be non-negative');
      }
    }

    // Verify site owner organization exists and has relationship with operator
    const siteOwnerOrg = await prisma.organization.findUnique({
      where: { id: data.site_owner_org_id },
    });

    if (!siteOwnerOrg) {
      throw new Error('Site owner organization not found');
    }

    // Verify project exists and belongs to operator (if provided)
    if (data.project_id) {
      const project = await prisma.project.findFirst({
        where: {
          id: data.project_id,
          operatorOrganizationId: operatorOrgId,
        },
      });

      if (!project) {
        throw new Error('Project not found or does not belong to operator');
      }
    }

    // Calculate amounts
    const subtotal = data.line_items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price;
    }, 0);

    const taxRate = await this.calculateTaxRate(operatorOrgId, data.site_owner_org_id);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(operatorOrgId);

    // Create invoice with line items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        operatorOrgId,
        siteOwnerOrgId: data.site_owner_org_id,
        projectId: data.project_id || null,
        status: InvoiceStatus.DRAFT,
        issueDate: new Date(data.issue_date),
        dueDate: new Date(data.due_date),
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        taxRate: new Prisma.Decimal(taxRate.toFixed(2)),
        taxAmount: new Prisma.Decimal(taxAmount.toFixed(2)),
        totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
        currency: data.currency || 'USD',
        notes: data.notes || null,
        paymentTerms: data.payment_terms || null,
        lineItems: {
          create: data.line_items.map((item, index) => ({
            description: item.description,
            quantity: new Prisma.Decimal(item.quantity.toFixed(2)),
            unitPrice: new Prisma.Decimal(item.unit_price.toFixed(2)),
            amount: new Prisma.Decimal((item.quantity * item.unit_price).toFixed(2)),
            sortOrder: index + 1,
          })),
        },
      },
      include: {
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        operatorOrg: {
          select: {
            id: true,
            name: true,
          },
        },
        siteOwnerOrg: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.formatInvoice(invoice);
  }

  /**
   * List invoices with filtering
   */
  async listInvoices(
    userOrgId: string,
    isOperator: boolean,
    filters: InvoiceFilters = {}
  ): Promise<{ invoices: any[]; total: number; limit: number; offset: number }> {
    const limit = Math.min(filters.limit || 50, 100);
    const offset = filters.offset || 0;

    const where: any = {};

    // Authorization filter
    if (isOperator) {
      where.operatorOrgId = userOrgId;
    } else {
      where.siteOwnerOrgId = userOrgId;
    }

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Project filter
    if (filters.project_id) {
      where.projectId = filters.project_id;
    }

    // Date range filter
    if (filters.date_from || filters.date_to) {
      where.issueDate = {};
      if (filters.date_from) {
        where.issueDate.gte = new Date(filters.date_from);
      }
      if (filters.date_to) {
        where.issueDate.lte = new Date(filters.date_to);
      }
    }

    // Search filter
    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { siteOwnerOrg: { name: { contains: filters.search, mode: 'insensitive' } } },
        { operatorOrg: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          siteOwnerOrg: {
            select: {
              id: true,
              name: true,
            },
          },
          operatorOrg: {
            select: {
              id: true,
              name: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      invoices: invoices.map((invoice) => this.formatInvoiceListItem(invoice)),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get single invoice by ID
   */
  async getInvoice(invoiceId: string, userOrgId: string): Promise<any> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        operatorOrg: {
          select: {
            id: true,
            name: true,
          },
        },
        siteOwnerOrg: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Authorization check
    if (invoice.operatorOrgId !== userOrgId && invoice.siteOwnerOrgId !== userOrgId) {
      throw new Error('Not authorized to view this invoice');
    }

    return this.formatInvoice(invoice);
  }

  /**
   * Update an existing invoice (only if status is DRAFT)
   */
  async updateInvoice(
    invoiceId: string,
    operatorOrgId: string,
    data: UpdateInvoiceData
  ): Promise<any> {
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!existingInvoice) {
      throw new Error('Invoice not found');
    }

    if (existingInvoice.operatorOrgId !== operatorOrgId) {
      throw new Error('Not authorized to update this invoice');
    }

    if (existingInvoice.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only draft invoices can be edited');
    }

    // Validate dates if provided
    if (data.issue_date || data.due_date) {
      const issueDate = data.issue_date ? new Date(data.issue_date) : existingInvoice.issueDate;
      const dueDate = data.due_date ? new Date(data.due_date) : existingInvoice.dueDate;

      if (dueDate <= issueDate) {
        throw new Error('Due date must be after issue date');
      }
    }

    const updateData: any = {};

    // Update basic fields
    if (data.issue_date) updateData.issueDate = new Date(data.issue_date);
    if (data.due_date) updateData.dueDate = new Date(data.due_date);
    if (data.currency) updateData.currency = data.currency;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.payment_terms !== undefined) updateData.paymentTerms = data.payment_terms;

    // If line items are being updated, recalculate everything
    if (data.line_items) {
      if (data.line_items.length === 0) {
        throw new Error('At least one line item is required');
      }

      const subtotal = data.line_items.reduce((sum, item) => {
        return sum + item.quantity * item.unit_price;
      }, 0);

      const taxRate = await this.calculateTaxRate(
        operatorOrgId,
        data.site_owner_org_id || existingInvoice.siteOwnerOrgId
      );
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      updateData.subtotal = new Prisma.Decimal(subtotal.toFixed(2));
      updateData.taxRate = new Prisma.Decimal(taxRate.toFixed(2));
      updateData.taxAmount = new Prisma.Decimal(taxAmount.toFixed(2));
      updateData.totalAmount = new Prisma.Decimal(totalAmount.toFixed(2));

      // Delete existing line items and create new ones
      await prisma.invoiceLineItem.deleteMany({
        where: { invoiceId },
      });

      updateData.lineItems = {
        create: data.line_items.map((item, index) => ({
          description: item.description,
          quantity: new Prisma.Decimal(item.quantity.toFixed(2)),
          unitPrice: new Prisma.Decimal(item.unit_price.toFixed(2)),
          amount: new Prisma.Decimal((item.quantity * item.unit_price).toFixed(2)),
          sortOrder: index + 1,
        })),
      };
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        operatorOrg: {
          select: {
            id: true,
            name: true,
          },
        },
        siteOwnerOrg: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.formatInvoice(invoice);
  }

  /**
   * Send invoice (change status to SENT)
   */
  async sendInvoice(invoiceId: string, operatorOrgId: string): Promise<any> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        siteOwnerOrg: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.operatorOrgId !== operatorOrgId) {
      throw new Error('Not authorized to send this invoice');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only draft invoices can be sent');
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.SENT,
        updatedAt: new Date(),
      },
      include: {
        lineItems: true,
        operatorOrg: true,
        siteOwnerOrg: true,
      },
    });

    // TODO: Send email notification to site owner with invoice PDF

    return {
      invoice_id: updatedInvoice.id,
      status: updatedInvoice.status,
      sent_at: updatedInvoice.updatedAt,
    };
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(
    invoiceId: string,
    operatorOrgId: string,
    reason?: string
  ): Promise<any> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.operatorOrgId !== operatorOrgId) {
      throw new Error('Not authorized to cancel this invoice');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Cannot cancel a paid invoice');
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.CANCELLED,
      },
    });

    // TODO: Send cancellation email notification to site owner

    return {
      invoice_id: updatedInvoice.id,
      status: updatedInvoice.status,
    };
  }

  /**
   * Delete invoice (only if DRAFT)
   */
  async deleteInvoice(invoiceId: string, operatorOrgId: string): Promise<void> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.operatorOrgId !== operatorOrgId) {
      throw new Error('Not authorized to delete this invoice');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only draft invoices can be deleted');
    }

    await prisma.invoice.delete({
      where: { id: invoiceId },
    });
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(operatorOrgId: string): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total outstanding (Sent + Overdue)
    const outstandingResult = await prisma.invoice.aggregate({
      where: {
        operatorOrgId,
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE],
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Total paid this month
    const paidThisMonthResult = await prisma.invoice.aggregate({
      where: {
        operatorOrgId,
        status: InvoiceStatus.PAID,
        paidAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Overdue count
    const overdueCount = await prisma.invoice.count({
      where: {
        operatorOrgId,
        dueDate: {
          lt: now,
        },
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE],
        },
      },
    });

    // Calculate average time to payment
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        operatorOrgId,
        status: InvoiceStatus.PAID,
        paidAt: {
          not: null,
        },
      },
      select: {
        issueDate: true,
        paidAt: true,
      },
    });

    let avgTimeToPayment = 0;
    if (paidInvoices.length > 0) {
      const totalDays = paidInvoices.reduce((sum, invoice) => {
        const days = Math.floor(
          (invoice.paidAt!.getTime() - invoice.issueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgTimeToPayment = Math.round(totalDays / paidInvoices.length);
    }

    return {
      total_outstanding: Number(outstandingResult._sum.totalAmount || 0),
      total_paid_this_month: Number(paidThisMonthResult._sum.totalAmount || 0),
      avg_time_to_payment_days: avgTimeToPayment,
      overdue_count: overdueCount,
    };
  }

  /**
   * Format invoice for API response
   */
  private formatInvoice(invoice: any): any {
    return {
      invoice_id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      operator_org_id: invoice.operatorOrgId,
      operator_org_name: invoice.operatorOrg?.name,
      site_owner_org_id: invoice.siteOwnerOrgId,
      site_owner_org_name: invoice.siteOwnerOrg?.name,
      project_id: invoice.projectId,
      project_name: invoice.project?.name,
      status: invoice.status,
      issue_date: invoice.issueDate.toISOString().split('T')[0],
      due_date: invoice.dueDate.toISOString().split('T')[0],
      subtotal: Number(invoice.subtotal),
      tax_rate: Number(invoice.taxRate),
      tax_amount: Number(invoice.taxAmount),
      total_amount: Number(invoice.totalAmount),
      currency: invoice.currency,
      notes: invoice.notes,
      payment_terms: invoice.paymentTerms,
      line_items: invoice.lineItems
        ? invoice.lineItems.map((item: any) => ({
            line_item_id: item.id,
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unitPrice),
            amount: Number(item.amount),
            sort_order: item.sortOrder,
          }))
        : [],
      created_at: invoice.createdAt.toISOString(),
      paid_at: invoice.paidAt?.toISOString() || null,
    };
  }

  /**
   * Format invoice for list view
   */
  private formatInvoiceListItem(invoice: any): any {
    return {
      invoice_id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      site_owner_org_name: invoice.siteOwnerOrg?.name,
      operator_org_name: invoice.operatorOrg?.name,
      project_name: invoice.project?.name,
      issue_date: invoice.issueDate.toISOString().split('T')[0],
      due_date: invoice.dueDate.toISOString().split('T')[0],
      total_amount: Number(invoice.totalAmount),
      currency: invoice.currency,
      status: invoice.status,
    };
  }
}

export const invoiceService = new InvoiceService();
