import { Router } from 'express';
import { payoutController } from '../controllers/payout.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All payout routes require authentication
router.use(authenticateToken);

// Stripe Connect account management (operator only)
router.post('/operators/connect-account', (req, res) =>
  payoutController.createConnectAccount(req, res)
);

router.get('/operators/connect-account/status', (req, res) =>
  payoutController.getConnectAccountStatus(req, res)
);

// Payout dashboard metrics (must come before /:id routes)
router.get('/dashboard', (req, res) =>
  payoutController.getDashboardMetrics(req, res)
);

// List payouts (operator only)
router.get('/', (req, res) =>
  payoutController.listPayouts(req, res)
);

// Get single payout details (operator only)
router.get('/:id', (req, res) =>
  payoutController.getPayout(req, res)
);

// Manual payout processing (superadmin only)
router.post('/:id/process', (req, res) =>
  payoutController.processPayout(req, res)
);

export default router;
