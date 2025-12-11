/**
 * Meeting Controller
 * Handles HTTP requests for meetings
 */

import { Request, Response, NextFunction } from 'express';
import { MeetingService } from '../services/meeting.service';
import { logger } from '../utils/logger';
import { CreateMeetingDto, JoinMeetingDto, MeetingControlDto, StartMusicDto, UpdateMusicVolumeDto, ShareResourceDto } from '../types/meeting.types';

// Lazy initialization with WebSocket service
let meetingServiceInstance: MeetingService | null = null;
let pendingWsService: any | null = null;

const getMeetingService = (): MeetingService => {
  if (!meetingServiceInstance) {
    meetingServiceInstance = new MeetingService();
    // Apply pending ws service if it was set before first access
    if (pendingWsService) {
      meetingServiceInstance.setWebSocketService(pendingWsService);
      pendingWsService = null;
    }
  }
  return meetingServiceInstance;
};

// Set WebSocket service (called from index.ts)
export const setWebSocketService = (wsService: any): void => {
  pendingWsService = wsService;
  if (meetingServiceInstance) {
    meetingServiceInstance.setWebSocketService(wsService);
    pendingWsService = null;
  }
};

// Extract user ID from JWT (assumes auth middleware sets req.user)
const getUserId = (req: Request): string => {
  const user = (req as any).user;
  if (!user || !user.id) {
    throw new Error('UNAUTHORIZED');
  }
  return user.id;
};

export const createMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const data: CreateMeetingDto = req.body;

    const meeting = await getMeetingService().createMeeting(userId, data);

    res.status(201).json({
      success: true,
      data: meeting
    });
  } catch (error: any) {
    logger.error('Create meeting error:', error);
    next(error);
  }
};

export const getMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const meeting = await getMeetingService().getMeeting(meetingId);

    if (!meeting) {
      res.status(404).json({
        success: false,
        error: 'MEETING_NOT_FOUND'
      });
      return;
    }

    res.json({
      success: true,
      data: meeting
    });
  } catch (error: any) {
    logger.error('Get meeting error:', error);
    next(error);
  }
};

export const listMeetings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const filters = {
      status: req.query.status as any,
      hostId: req.query.hostId as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    const meetings = await getMeetingService().listMeetings(filters);

    res.json({
      success: true,
      data: meetings,
      count: meetings.length
    });
  } catch (error: any) {
    logger.error('List meetings error:', error);
    next(error);
  }
};

export const joinMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const data: JoinMeetingDto = {
      meetingId: req.params.meetingId,
      role: req.body.role
    };

    const result = await getMeetingService().joinMeeting(userId, data);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Join meeting error:', error);
    next(error);
  }
};

export const leaveMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { meetingId } = req.params;

    await getMeetingService().leaveMeeting(meetingId, userId);

    res.json({
      success: true,
      message: 'Left meeting successfully'
    });
  } catch (error: any) {
    logger.error('Leave meeting error:', error);
    next(error);
  }
};

export const controlMeeting = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { meetingId } = req.params;
    const control: MeetingControlDto = req.body;

    await getMeetingService().controlMeeting(meetingId, userId, control);

    res.json({
      success: true,
      message: `Meeting control ${control.action} executed successfully`
    });
  } catch (error: any) {
    logger.error('Control meeting error:', error);
    next(error);
  }
};

export const raiseHand = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { meetingId } = req.params;

    await getMeetingService().raiseHand(meetingId, userId);

    res.json({
      success: true,
      message: 'Hand raised'
    });
  } catch (error: any) {
    logger.error('Raise hand error:', error);
    next(error);
  }
};

export const lowerHand = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { meetingId } = req.params;

    await getMeetingService().lowerHand(meetingId, userId);

    res.json({
      success: true,
      message: 'Hand lowered'
    });
  } catch (error: any) {
    logger.error('Lower hand error:', error);
    next(error);
  }
};

/**
 * Start background music
 */
export const startBackgroundMusic = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { meetingId } = req.params;
    const data: StartMusicDto = req.body;

    const musicState = await getMeetingService().startBackgroundMusic(meetingId, userId, data);

    res.json({
      success: true,
      data: musicState,
      message: 'Background music started'
    });
  } catch (error: any) {
    logger.error('Start music error:', error);
    next(error);
  }
};

/**
 * Stop background music
 */
export const stopBackgroundMusic = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { meetingId } = req.params;

    await getMeetingService().stopBackgroundMusic(meetingId, userId);

    res.json({
      success: true,
      message: 'Background music stopped'
    });
  } catch (error: any) {
    logger.error('Stop music error:', error);
    next(error);
  }
};

/**
 * Update music volume
 */
export const updateMusicVolume = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { meetingId } = req.params;
    const data: UpdateMusicVolumeDto = req.body;

    await getMeetingService().updateMusicVolume(meetingId, userId, data);

    res.json({
      success: true,
      message: 'Music volume updated'
    });
  } catch (error: any) {
    logger.error('Update music volume error:', error);
    next(error);
  }
};

/**
 * Get current music state
 */
export const getMusicState = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const musicState = await getMeetingService().getMusicState(meetingId);

    res.json({
      success: true,
      data: musicState
    });
  } catch (error: any) {
    logger.error('Get music state error:', error);
    next(error);
  }
};

export const startRecording = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { meetingId } = req.params;

    const recordingState = await getMeetingService().startRecording(meetingId, userId);

    res.json({
      success: true,
      data: recordingState,
      message: 'Recording started'
    });
  } catch (error: any) {
    logger.error('Start recording error:', error);
    next(error);
  }
};

export const stopRecording = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { meetingId } = req.params;

    const recordingState = await getMeetingService().stopRecording(meetingId, userId);

    res.json({
      success: true,
      data: recordingState,
      message: 'Recording stopped'
    });
  } catch (error: any) {
    logger.error('Stop recording error:', error);
    next(error);
  }
};

/**
 * Get current recording state
 */
export const getRecordingState = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const recordingState = await getMeetingService().getRecordingState(meetingId);

    res.json({
      success: true,
      data: recordingState
    });
  } catch (error: any) {
    logger.error('Get recording state error:', error);
    next(error);
  }
};

export const startScreenshare = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { meetingId } = req.params;

    await getMeetingService().startScreenshare(meetingId, userId);

    res.json({
      success: true,
      message: 'Screenshare started'
    });
  } catch (error: any) {
    logger.error('Start screenshare error:', error);
    next(error);
  }
};

export const stopScreenshare = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { meetingId } = req.params;

    await getMeetingService().stopScreenshare(meetingId, userId);

    res.json({
      success: true,
      message: 'Screenshare stopped'
    });
  } catch (error: any) {
    logger.error('Stop screenshare error:', error);
    next(error);
  }
};

export const shareResource = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { meetingId } = req.params;
    const resource: ShareResourceDto = req.body;

    await getMeetingService().shareResource(meetingId, userId, resource);

    res.json({
      success: true,
      message: 'Resource shared'
    });
  } catch (error: any) {
    logger.error('Share resource error:', error);
    next(error);
  }
};

