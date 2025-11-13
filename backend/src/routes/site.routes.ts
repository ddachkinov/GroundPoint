import { Router } from 'express';
import { siteController } from '../controllers/site.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireOperator } from '../middleware/rbac.middleware';

const router = Router();

// All site routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/v1/sites/:id
 * @desc    Get site by ID
 * @access  Operator or Site Owner (if invited to project)
 */
router.get('/:id', (req, res) => siteController.getSite(req, res));

/**
 * @route   PATCH /api/v1/sites/:id
 * @desc    Update site
 * @access  Operator Admin/Member
 */
router.patch('/:id', requireOperator, (req, res) => siteController.updateSite(req, res));

/**
 * @route   DELETE /api/v1/sites/:id
 * @desc    Delete site
 * @access  Operator Admin/Member
 */
router.delete('/:id', requireOperator, (req, res) => siteController.deleteSite(req, res));

/**
 * @route   POST /api/v1/sites/:id/angles
 * @desc    Create angle for site
 * @access  Operator Admin/Member
 */
router.post('/:id/angles', requireOperator, (req, res) => siteController.createAngle(req, res));

/**
 * @route   GET /api/v1/sites/:id/angles
 * @desc    List angles for site
 * @access  Authenticated users
 */
router.get('/:id/angles', (req, res) => siteController.listAngles(req, res));

export default router;
