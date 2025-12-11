/**
 * Request Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const phoneNumberSchema = z.object({
  phoneNumber: z.string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format. Must include country code (e.g., +1234567890)'),
  age: z.number().int().min(13, 'Must be 13 years or older').optional(),
  deliveryMethod: z.enum(['sms', 'whatsapp']).optional().default('sms')
});

const verifyOtpSchema = z.object({
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  guidelinesAccepted: z.boolean().refine(val => val === true, {
    message: 'Community Guidelines must be accepted'
  }),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  deviceType: z.enum(['ios', 'android', 'web']).optional()
});

const loginSchema = z.object({
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
  deliveryMethod: z.enum(['sms', 'whatsapp']).optional().default('sms')
});

export const validateRegisterPhone = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    phoneNumberSchema.parse(req.body);
    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.errors[0]?.message || 'Invalid request data'
      }
    });
  }
};

export const validateVerifyPhone = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    verifyOtpSchema.parse(req.body);
    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.errors[0]?.message || 'Invalid request data'
      }
    });
  }
};

export const validateLoginPhone = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.errors[0]?.message || 'Invalid request data'
      }
    });
  }
};

