/**
 * Rate Limiting Middleware
 */

import rateLimit, { Options } from 'express-rate-limit';
import { Request } from 'express';

// Store limiter instances
const createLimiter = (
  windowMs: number, 
  max: number, 
  keyGenerator?: (req: Request) => string
): ReturnType<typeof rateLimit> => {
  const getDefaultKey = (req: Request): string => {
    if (req.ip) return req.ip;
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      return Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    }
    return 'unknown';
  };

  const options: Partial<Options> = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || getDefaultKey,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later'
        }
      });
    }
  };

  return rateLimit(options);
};

export const rateLimiter = {
  // Register phone: 5 requests per hour per phone number
  registerPhone: createLimiter(
    60 * 60 * 1000, // 1 hour
    5,
    (req) => `register:${req.body.phoneNumber || req.ip}`
  ),

  // Verify OTP: 10 requests per hour per phone number
  verifyPhone: createLimiter(
    60 * 60 * 1000,
    10,
    (req) => `verify:${req.body.phoneNumber || req.ip}`
  ),

  // Resend OTP: 3 requests per hour per phone number
  resendOtp: createLimiter(
    60 * 60 * 1000,
    3,
    (req) => `resend:${req.body.phoneNumber || req.ip}`
  ),

  // Login: 5 requests per hour per phone number
  loginPhone: createLimiter(
    60 * 60 * 1000,
    5,
    (req) => `login:${req.body.phoneNumber || req.ip}`
  ),

  // General API: 100 requests per minute per IP
  general: createLimiter(60 * 1000, 100)
};

