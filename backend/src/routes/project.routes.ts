import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { siteController } from '../controllers/site.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireOperator } from '../middleware/rbac.middleware';

const router = Router();

// All project routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/v1/projects
 * @desc    Create a new project
 * @access  Operator Admin/Member
 */
router.post('/', requireOperator, (req, res) => projectController.createProject(req, res));

/**
 * @route   GET /api/v1/projects
 * @desc    List all projects for organization
 * @access  Operator Admin/Member
 */
router.get('/', requireOperator, (req, res) => projectController.listProjects(req, res));

/**
 * @route   GET /api/v1/projects/:id
 * @desc    Get project by ID
 * @access  Operator or Site Owner (if invited)
 */
router.get('/:id', (req, res) => projectController.getProject(req, res));

/**
 * @route   PATCH /api/v1/projects/:id
 * @desc    Update project
 * @access  Operator Admin
 */
router.patch('/:id', requireOperator, (req, res) => projectController.updateProject(req, res));

/**
 * @route   DELETE /api/v1/projects/:id
 * @desc    Archive project (soft delete)
 * @access  Operator Admin
 */
router.delete('/:id', requireOperator, (req, res) => projectController.archiveProject(req, res));

/**
 * @route   POST /api/v1/projects/:id/sites
 * @desc    Create site in project
 * @access  Operator Admin/Member
 */
router.post('/:id/sites', requireOperator, (req, res) => projectController.createSite(req, res));

export default router;
