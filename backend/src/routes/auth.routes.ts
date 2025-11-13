import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  loginRateLimit,
  registrationRateLimit,
  passwordResetRateLimit,
} from '../middleware/rateLimit.middleware';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registrationRateLimit, (req, res) => authController.register(req, res));

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', (req, res) => authController.verifyEmail(req, res));

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginRateLimit, (req, res) => authController.login(req, res));

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', (req, res) => authController.refreshToken(req, res));

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', (req, res) => authController.logout(req, res));

/**
 * @route   POST /api/v1/auth/password-reset
 * @desc    Request password reset
 * @access  Public
 */
router.post('/password-reset', passwordResetRateLimit, (req, res) =>
  authController.requestPasswordReset(req, res)
);

/**
 * @route   POST /api/v1/auth/password-reset/confirm
 * @desc    Confirm password reset
 * @access  Public
 */
router.post('/password-reset/confirm', (req, res) =>
  authController.confirmPasswordReset(req, res)
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authMiddleware, (req, res) => authController.getCurrentUser(req, res));

export default router;
