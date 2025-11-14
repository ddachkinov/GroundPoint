import { Router } from 'express';
import { feeController } from '../controllers/fee.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All fee routes require authentication
router.use(authenticateToken);

// Fee summary (must come before /:id routes)
router.get('/summary', (req, res) =>
  feeController.getFeeSummary(req, res)
);

// Payment fee breakdown
router.get('/payment/:paymentId', (req, res) =>
  feeController.getPaymentFees(req, res)
);

// Payout fee breakdown
router.get('/payout/:payoutId/breakdown', (req, res) =>
  feeController.getPayoutFeeBreakdown(req, res)
);

// Reconciliation report (superadmin only)
router.get('/reconciliation', (req, res) =>
  feeController.getReconciliationReport(req, res)
);

// List fees
router.get('/', (req, res) =>
  feeController.listFees(req, res)
);

export default router;
