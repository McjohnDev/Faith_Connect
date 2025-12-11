/**
 * Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { MeetingRole } from '../types/meeting.types';

const schemas = {
  createMeeting: z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    scheduledStart: z.string().datetime().optional(),
    maxParticipants: z.number().int().min(2).max(1000).optional(),
    backgroundMusicEnabled: z.boolean().optional(),
    recordingEnabled: z.boolean().optional()
  }),

  joinMeeting: z.object({
    role: z.nativeEnum(MeetingRole).optional()
  }),

  meetingControl: z.object({
    action: z.enum(['mute', 'unmute', 'remove', 'promote', 'demote', 'lock', 'unlock']),
    participantId: z.string().uuid().optional(),
    role: z.nativeEnum(MeetingRole).optional()
  }),

  startMusic: z.object({
    source: z.enum(['upload', 'stream', 'url']),
    trackUrl: z.string().url('Invalid track URL'),
    volume: z.number().min(0).max(100).optional(),
    isLooping: z.boolean().optional()
  }),

  updateMusicVolume: z.object({
    volume: z.number().min(0).max(100)
  }),

  startRecording: z.object({
    // placeholder: no body fields required for now
  }),

  stopRecording: z.object({
    // placeholder: no body fields required for now
  }),

  startScreenshare: z.object({
    // placeholder: no body fields required for now
  }),

  stopScreenshare: z.object({
    // placeholder: no body fields required for now
  }),

  shareResource: z.object({
    type: z.enum(['pdf', 'image', 'link', 'video', 'audio', 'other']),
    url: z.string().url('Invalid resource URL'),
    name: z.string().min(1).max(200),
    description: z.string().max(500).optional()
  })
};

export const validateRequest = (schemaName: keyof typeof schemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const schema = schemas[schemaName];
      schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error:', error.errors);
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          details: error.errors
        });
        return;
      }
      next(error);
    }
  };
};

