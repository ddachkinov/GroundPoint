import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

/**
 * Generic rate limiter middleware
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip || 'unknown',
    message = 'Too many requests. Please try again later.',
    skipSuccessfulRequests = false,
  } = config;

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const key = `rate_limit:${keyGenerator(req)}`;
      const ttl = Math.ceil(windowMs / 1000); // Convert to seconds

      // Get current count
      const current = await redis.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= maxRequests) {
        res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message,
            retryAfter: await redis.ttl(key),
          },
        });
        return;
      }

      // Increment count
      if (count === 0) {
        // First request in window, set with expiration
        await redis.setex(key, ttl, '1');
      } else {
        // Subsequent request, increment
        await redis.incr(key);
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - count - 1).toString());
      res.setHeader('X-RateLimit-Reset', (Date.now() + windowMs).toString());

      // If we should skip successful requests, decrement on successful response
      if (skipSuccessfulRequests) {
        const originalSend = res.send;
        res.send = function (body: any): Response {
          if (res.statusCode < 400) {
            redis.decr(key).catch(console.error);
          }
          return originalSend.call(this, body);
        };
      }

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
}

/**
 * Rate limiter for login attempts (by email)
 * 5 attempts per hour per email
 */
export const loginRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  keyGenerator: (req) => `login:${req.body.email}`,
  message: 'Too many login attempts. Please try again in an hour.',
  skipSuccessfulRequests: true, // Only count failed attempts
});

/**
 * Rate limiter for registration
 * 3 registrations per hour per IP
 */
export const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  keyGenerator: (req) => `register:${req.ip}`,
  message: 'Too many registration attempts. Please try again later.',
});

/**
 * Rate limiter for password reset requests
 * 3 requests per hour per email
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  keyGenerator: (req) => `password_reset:${req.body.email}`,
  message: 'Too many password reset requests. Please try again later.',
});

/**
 * Rate limiter for API requests (general)
 * 100 requests per minute per user
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyGenerator: (req) => {
    const userId = req.user?.userId || req.ip;
    return `api:${userId}`;
  },
  message: 'API rate limit exceeded. Please slow down.',
});

/**
 * Rate limiter for file uploads
 * 10 concurrent uploads per user
 */
export const uploadRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10,
  keyGenerator: (req) => {
    const userId = req.user?.userId || req.ip;
    return `upload:${userId}`;
  },
  message: 'Too many concurrent uploads. Please wait and try again.',
});
