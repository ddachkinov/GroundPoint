import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Get current subscription (requires authentication)
router.get('/current', authenticateToken, (req, res) =>
  subscriptionController.getCurrentSubscription(req, res)
);

// Create checkout session (requires authentication)
router.post('/checkout', authenticateToken, (req, res) =>
  subscriptionController.createCheckoutSession(req, res)
);

// Create portal session (requires authentication)
router.post('/portal', authenticateToken, (req, res) =>
  subscriptionController.createPortalSession(req, res)
);

// Get usage statistics (requires authentication)
router.get('/usage', authenticateToken, (req, res) =>
  subscriptionController.getUsageStats(req, res)
);

// Cancel subscription (requires authentication)
router.post('/cancel', authenticateToken, (req, res) =>
  subscriptionController.cancelSubscription(req, res)
);

// Reactivate subscription (requires authentication)
router.post('/reactivate', authenticateToken, (req, res) =>
  subscriptionController.reactivateSubscription(req, res)
);

// Check quota (requires authentication)
router.get('/check-quota/:type', authenticateToken, (req, res) =>
  subscriptionController.checkQuota(req, res)
);

export default router;
