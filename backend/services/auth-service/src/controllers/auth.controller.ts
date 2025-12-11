/**
 * Auth Controller
 * Handles authentication logic
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';

// Lazy initialization - only create service when needed
let authServiceInstance: AuthService | null = null;

const getAuthService = (): AuthService => {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
};

/**
 * Register with phone number
 * Sends OTP via SMS or WhatsApp
 */
export const registerPhone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phoneNumber, age, deliveryMethod = 'sms' } = req.body;

    // Validate delivery method
    if (deliveryMethod !== 'sms' && deliveryMethod !== 'whatsapp') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DELIVERY_METHOD',
          message: 'Delivery method must be "sms" or "whatsapp"'
        }
      });
      return;
    }

    // Age gate check (≥13)
    if (age < 13) {
      res.status(403).json({
        success: false,
        error: {
          code: 'AGE_RESTRICTION',
          message: 'Users must be 13 years or older'
        }
      });
      return;
    }

    const result = await getAuthService().sendOtp(phoneNumber, deliveryMethod);

    res.status(200).json({
      success: true,
      data: {
        phoneNumber: result.phoneNumber,
        expiresIn: result.expiresIn,
        deliveryMethod: result.deliveryMethod,
        message: `OTP sent successfully via ${result.deliveryMethod.toUpperCase()}`
      }
    });
  } catch (error: any) {
    logger.error('Register phone error:', error);
    next(error);
  }
};

/**
 * Verify OTP and create account
 */
export const verifyPhone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phoneNumber, otp, guidelinesAccepted, deviceId, deviceName, deviceType } = req.body;

    // Check guidelines acceptance
    if (!guidelinesAccepted) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GUIDELINES_REQUIRED',
          message: 'Community Guidelines must be accepted'
        }
      });
      return;
    }

    const result = await getAuthService().verifyOtp(
      phoneNumber,
      otp,
      guidelinesAccepted,
      deviceId,
      deviceName,
      deviceType
    );

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: 900 // 15 minutes
        }
      }
    });
  } catch (error: any) {
    logger.error('Verify phone error:', error);
    next(error);
  }
};

/**
 * Resend OTP
 */
export const resendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phoneNumber, deliveryMethod = 'sms' } = req.body;

    // Validate delivery method
    if (deliveryMethod !== 'sms' && deliveryMethod !== 'whatsapp') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DELIVERY_METHOD',
          message: 'Delivery method must be "sms" or "whatsapp"'
        }
      });
      return;
    }

    const result = await getAuthService().sendOtp(phoneNumber, deliveryMethod);

    res.status(200).json({
      success: true,
      data: {
        phoneNumber: result.phoneNumber,
        expiresIn: result.expiresIn,
        deliveryMethod: result.deliveryMethod,
        message: `OTP resent successfully via ${result.deliveryMethod.toUpperCase()}`
      }
    });
  } catch (error: any) {
    logger.error('Resend OTP error:', error);
    next(error);
  }
};

/**
 * Login with phone number
 * Sends OTP for existing users via SMS or WhatsApp
 */
export const loginPhone = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phoneNumber, deliveryMethod = 'sms' } = req.body;

    // Validate delivery method
    if (deliveryMethod !== 'sms' && deliveryMethod !== 'whatsapp') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DELIVERY_METHOD',
          message: 'Delivery method must be "sms" or "whatsapp"'
        }
      });
      return;
    }

    const result = await getAuthService().sendOtp(phoneNumber, deliveryMethod, true);

    res.status(200).json({
      success: true,
      data: {
        phoneNumber: result.phoneNumber,
        expiresIn: result.expiresIn,
        deliveryMethod: result.deliveryMethod,
        message: `OTP sent for login via ${result.deliveryMethod.toUpperCase()}`
      }
    });
  } catch (error: any) {
    logger.error('Login phone error:', error);
    next(error);
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    const result = await getAuthService().refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: 900
      }
    });
  } catch (error: any) {
    logger.error('Refresh token error:', error);
    next(error);
  }
};

/**
 * Logout and revoke tokens
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const userId = (req as any).user?.userId;

    await getAuthService().revokeTokens(userId, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    logger.error('Logout error:', error);
    next(error);
  }
};

