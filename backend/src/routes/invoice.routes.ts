import { Router } from 'express';
import { invoiceController } from '../controllers/invoice.controller';
import { paymentController } from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All invoice routes require authentication
router.use(authenticateToken);

// Dashboard metrics (must come before /:id routes)
router.get('/dashboard', (req, res) => invoiceController.getDashboardMetrics(req, res));

// Create invoice
router.post('/', (req, res) => invoiceController.createInvoice(req, res));

// List invoices
router.get('/', (req, res) => invoiceController.listInvoices(req, res));

// Get single invoice
router.get('/:id', (req, res) => invoiceController.getInvoice(req, res));

// Update invoice
router.patch('/:id', (req, res) => invoiceController.updateInvoice(req, res));

// Delete invoice
router.delete('/:id', (req, res) => invoiceController.deleteInvoice(req, res));

// Send invoice
router.post('/:id/send', (req, res) => invoiceController.sendInvoice(req, res));

// Cancel invoice
router.post('/:id/cancel', (req, res) => invoiceController.cancelInvoice(req, res));

// Create payment intent for invoice
router.post('/:id/payment-intent', (req, res) => paymentController.createPaymentIntent(req, res));

// Download invoice PDF
router.get('/:id/pdf', (req, res) => invoiceController.downloadInvoicePDF(req, res));

export default router;
