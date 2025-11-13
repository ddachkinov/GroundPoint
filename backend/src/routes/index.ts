import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import siteRoutes from './site.routes';
import captureRoutes from './capture.routes';

const router = Router();

// Register all route modules
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/sites', siteRoutes);
router.use('/captures', captureRoutes);

export default router;
