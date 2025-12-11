/**
 * Auth Routes
 * Phone OTP Authentication endpoints
 */

import { Router } from 'express';
import { registerPhone, verifyPhone, resendOtp, loginPhone, refreshToken, logout } from '../controllers/auth.controller';
import { validateRegisterPhone, validateVerifyPhone, validateLoginPhone } from '../middleware/validation';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * POST /api/v1/auth/register-phone
 * Register with phone number (sends OTP)
 */
router.post('/register-phone', 
  rateLimiter.registerPhone,
  validateRegisterPhone,
  registerPhone
);

/**
 * POST /api/v1/auth/verify-phone
 * Verify OTP and create account
 */
router.post('/verify-phone',
  rateLimiter.verifyPhone,
  validateVerifyPhone,
  verifyPhone
);

/**
 * POST /api/v1/auth/resend-otp
 * Resend OTP to phone number
 */
router.post('/resend-otp',
  rateLimiter.resendOtp,
  validateRegisterPhone,
  resendOtp
);

/**
 * POST /api/v1/auth/login-phone
 * Login with phone number (sends OTP)
 */
router.post('/login-phone',
  rateLimiter.loginPhone,
  validateLoginPhone,
  loginPhone
);

/**
 * POST /api/v1/auth/refresh-token
 * Refresh access token
 */
router.post('/refresh-token',
  refreshToken
);

/**
 * POST /api/v1/auth/logout
 * Logout and revoke tokens
 */
router.post('/logout',
  logout
);

export { router as authRouter };

