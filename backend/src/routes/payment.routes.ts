import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All payment routes require authentication
router.use(authenticateToken);

// List payments
router.get('/', (req, res) => paymentController.listPayments(req, res));

// Get single payment
router.get('/:id', (req, res) => paymentController.getPayment(req, res));

// Refund payment (superadmin only)
router.post('/:id/refund', (req, res) => paymentController.refundPayment(req, res));

export default router;
