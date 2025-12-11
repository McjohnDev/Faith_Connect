/**
 * Meeting Routes
 */

import { Router } from 'express';
import {
  createMeeting,
  getMeeting,
  listMeetings,
  joinMeeting,
  leaveMeeting,
  controlMeeting,
  raiseHand,
  lowerHand,
  startBackgroundMusic,
  stopBackgroundMusic,
  updateMusicVolume,
  getMusicState,
  startRecording,
  stopRecording,
  startScreenshare,
  stopScreenshare,
  shareResource
} from '../controllers/meeting.controller';
import { validateRequest } from '../middleware/validation';
import { rateLimiter } from '../middleware/rateLimiter';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Create meeting
router.post(
  '/',
  rateLimiter.createMeeting,
  validateRequest('createMeeting'),
  createMeeting
);

// List meetings
router.get(
  '/',
  rateLimiter.listMeetings,
  listMeetings
);

// Get meeting details
router.get(
  '/:meetingId',
  rateLimiter.getMeeting,
  getMeeting
);

// Join meeting
router.post(
  '/:meetingId/join',
  rateLimiter.joinMeeting,
  validateRequest('joinMeeting'),
  joinMeeting
);

// Leave meeting
router.post(
  '/:meetingId/leave',
  rateLimiter.leaveMeeting,
  leaveMeeting
);

// Raise hand
router.post(
  '/:meetingId/hand/raise',
  rateLimiter.raiseHand,
  raiseHand
);

// Lower hand
router.post(
  '/:meetingId/hand/lower',
  rateLimiter.raiseHand,
  lowerHand
);

// Meeting controls (mute, unmute, remove, etc.)
router.post(
  '/:meetingId/control',
  rateLimiter.controlMeeting,
  validateRequest('meetingControl'),
  controlMeeting
);

// Background music controls
router.post(
  '/:meetingId/music/start',
  rateLimiter.controlMeeting,
  validateRequest('startMusic'),
  startBackgroundMusic
);

router.post(
  '/:meetingId/music/stop',
  rateLimiter.controlMeeting,
  stopBackgroundMusic
);

router.put(
  '/:meetingId/music/volume',
  rateLimiter.controlMeeting,
  validateRequest('updateMusicVolume'),
  updateMusicVolume
);

router.get(
  '/:meetingId/music',
  rateLimiter.getMeeting,
  getMusicState
);

// Recording placeholders
router.post(
  '/:meetingId/recording/start',
  rateLimiter.controlMeeting,
  validateRequest('startRecording'),
  startRecording
);

router.post(
  '/:meetingId/recording/stop',
  rateLimiter.controlMeeting,
  validateRequest('stopRecording'),
  stopRecording
);

// Screenshare placeholders
router.post(
  '/:meetingId/screenshare/start',
  rateLimiter.controlMeeting,
  validateRequest('startScreenshare'),
  startScreenshare
);

router.post(
  '/:meetingId/screenshare/stop',
  rateLimiter.controlMeeting,
  validateRequest('stopScreenshare'),
  stopScreenshare
);

// Resource sharing placeholder
router.post(
  '/:meetingId/resources/share',
  rateLimiter.controlMeeting,
  validateRequest('shareResource'),
  shareResource
);

export default router;

