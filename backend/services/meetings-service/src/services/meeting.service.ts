/**
 * Meeting Service
 * Core business logic for meetings
 */

import { randomUUID } from 'crypto';
import { AgoraService } from './agora.service';
import { DatabaseService } from './database.service';
import { MusicStateRepository } from '../repositories/musicState.repository';
import { logger } from '../utils/logger';
import {
  Meeting,
  MeetingParticipant,
  MeetingRole,
  MeetingStatus,
  CreateMeetingDto,
  JoinMeetingDto,
  UpdateMeetingDto,
  MeetingControlDto,
  BackgroundMusicState,
  StartMusicDto,
  UpdateMusicVolumeDto,
  ShareResourceDto
} from '../types/meeting.types';

export class MeetingService {
  private agoraService: AgoraService;
  private dbService: DatabaseService;
  private wsService?: any; // WebSocketService (circular dependency, set via setter)
  private musicRepo: MusicStateRepository;

  constructor() {
    this.agoraService = new AgoraService();
    this.dbService = new DatabaseService();
    this.musicRepo = new MusicStateRepository();
  }

  /**
   * Set WebSocket service (called after initialization to avoid circular dependency)
   */
  setWebSocketService(wsService: any): void {
    this.wsService = wsService;
  }

  /**
   * Create a new meeting
   */
  async createMeeting(userId: string, data: CreateMeetingDto): Promise<Meeting> {
    const meetingId = randomUUID();
    const channelName = `meeting_${meetingId.replace(/-/g, '')}`;

    const meeting: Meeting = {
      id: meetingId,
      title: data.title,
      description: data.description,
      hostId: userId,
      channelName,
      agoraAppId: this.agoraService.getAppId(),
      status: MeetingStatus.SCHEDULED,
      scheduledStart: data.scheduledStart,
      maxParticipants: data.maxParticipants,
      isLocked: false,
      backgroundMusicEnabled: data.backgroundMusicEnabled || false,
      recordingEnabled: data.recordingEnabled || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.dbService.createMeeting(meeting);

    // Add host as participant
    await this.addParticipant(meetingId, userId, MeetingRole.HOST);

    logger.info(`Meeting created: ${meetingId} by user ${userId}`);
    return meeting;
  }

  /**
   * Join a meeting
   */
  async joinMeeting(
    userId: string,
    data: JoinMeetingDto
  ): Promise<{
    meeting: Meeting;
    participant: MeetingParticipant;
    agoraToken: string;
    agoraUid: number;
  }> {
    const meeting = await this.dbService.getMeeting(data.meetingId);
    if (!meeting) {
      throw new Error('MEETING_NOT_FOUND');
    }

    if (meeting.isLocked && meeting.hostId !== userId) {
      throw new Error('MEETING_LOCKED');
    }

    if (meeting.status === MeetingStatus.ENDED || meeting.status === MeetingStatus.CANCELLED) {
      throw new Error('MEETING_ENDED');
    }

    // Check participant count
    const participantCount = await this.dbService.getMeetingParticipantCount(data.meetingId);
    if (meeting.maxParticipants && participantCount >= meeting.maxParticipants) {
      throw new Error('MEETING_FULL');
    }

    // Determine role
    const role = data.role || (meeting.hostId === userId ? MeetingRole.HOST : MeetingRole.LISTENER);

    // Add participant
    const participant = await this.addParticipant(data.meetingId, userId, role);

    // Emit WebSocket event
    if (this.wsService) {
      this.wsService.participantJoined(data.meetingId, participant);
    }

    // Update meeting status if first participant
    if (participantCount === 0 && meeting.status === MeetingStatus.SCHEDULED) {
      await this.updateMeetingStatus(data.meetingId, MeetingStatus.ACTIVE);
    }

    // Generate Agora token (or mock token if Agora not configured)
    const agoraUid = participant.agoraUid || Math.floor(Math.random() * 1000000);
    let agoraToken: string;
    
    try {
      agoraToken = this.agoraService.generateToken(
        meeting.channelName,
        agoraUid,
        role === MeetingRole.LISTENER ? 'subscriber' : 'publisher'
      );
    } catch (error: any) {
      if (error.message === 'AGORA_NOT_CONFIGURED') {
        // For testing: generate a mock token
        logger.warn('Agora not configured - using mock token for testing');
        agoraToken = `mock_token_${meeting.channelName}_${agoraUid}_${Date.now()}`;
      } else {
        throw error;
      }
    }

    logger.info(`User ${userId} joined meeting ${data.meetingId} as ${role}`);
    return {
      meeting,
      participant,
      agoraToken,
      agoraUid
    };
  }

  /**
   * Leave a meeting
   */
  async leaveMeeting(meetingId: string, userId: string): Promise<void> {
    await this.dbService.removeParticipant(meetingId, userId);

    // Emit WebSocket event
    if (this.wsService) {
      this.wsService.participantLeft(meetingId, userId);
    }

    // Check if meeting should end (no participants left)
    const participantCount = await this.dbService.getMeetingParticipantCount(meetingId);
    if (participantCount === 0) {
      await this.updateMeetingStatus(meetingId, MeetingStatus.ENDED);
    }

    logger.info(`User ${userId} left meeting ${meetingId}`);
  }

  /**
   * Add participant to meeting
   */
  private async addParticipant(
    meetingId: string,
    userId: string,
    role: MeetingRole
  ): Promise<MeetingParticipant> {
    const agoraUid = Math.floor(Math.random() * 1000000);

    const participant: MeetingParticipant = {
      id: randomUUID(),
      meetingId,
      userId,
      role,
      isMuted: role === MeetingRole.LISTENER,
      hasRaisedHand: false,
      joinedAt: new Date(),
      agoraUid
    };

    await this.dbService.addParticipant(participant);
    return participant;
  }

  /**
   * Update meeting status
   */
  private async updateMeetingStatus(meetingId: string, status: MeetingStatus): Promise<void> {
    const update: UpdateMeetingDto = { status };
    if (status === MeetingStatus.ACTIVE) {
      // startedAt will be set by database trigger or service
    } else if (status === MeetingStatus.ENDED) {
      // endedAt will be set by database trigger or service
    }
    await this.dbService.updateMeeting(meetingId, update);
  }

  /**
   * Get meeting details
   */
  async getMeeting(meetingId: string): Promise<Meeting | null> {
    return await this.dbService.getMeeting(meetingId);
  }

  /**
   * List meetings
   */
  async listMeetings(filters?: {
    status?: MeetingStatus;
    hostId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Meeting[]> {
    return await this.dbService.listMeetings(filters);
  }

  /**
   * Meeting controls (mute, unmute, remove, etc.)
   */
  async controlMeeting(
    meetingId: string,
    userId: string,
    control: MeetingControlDto
  ): Promise<void> {
    const meeting = await this.dbService.getMeeting(meetingId);
    if (!meeting) {
      throw new Error('MEETING_NOT_FOUND');
    }

    // Check permissions
    const participant = await this.dbService.getParticipant(meetingId, userId);
    if (!participant) {
      throw new Error('NOT_PARTICIPANT');
    }

    const isHost = participant.role === MeetingRole.HOST || participant.role === MeetingRole.CO_HOST;
    const isSelf = control.participantId === userId;

    switch (control.action) {
      case 'mute':
      case 'unmute':
        if (!isSelf && !isHost) {
          throw new Error('INSUFFICIENT_PERMISSIONS');
        }
        await this.dbService.updateParticipant(meetingId, control.participantId || userId, {
          isMuted: control.action === 'mute'
        });
        break;

      case 'remove':
        if (!isHost) {
          throw new Error('INSUFFICIENT_PERMISSIONS');
        }
        await this.dbService.removeParticipant(meetingId, control.participantId!);
        break;

      case 'promote':
      case 'demote':
        if (!isHost) {
          throw new Error('INSUFFICIENT_PERMISSIONS');
        }
        await this.dbService.updateParticipant(meetingId, control.participantId!, {
          role: control.role!
        });
        
        // Emit WebSocket event
        if (this.wsService && control.role) {
          this.wsService.hostPromoted(meetingId, control.participantId!, control.role);
        }
        break;

      case 'lock':
      case 'unlock':
        if (meeting.hostId !== userId) {
          throw new Error('INSUFFICIENT_PERMISSIONS');
        }
        await this.dbService.updateMeeting(meetingId, {
          isLocked: control.action === 'lock'
        });
        if (this.wsService) {
          this.wsService.emitToMeeting(meetingId, control.action === 'lock' ? 'meeting:locked' : 'meeting:unlocked', {
            meetingId,
            userId,
            timestamp: new Date().toISOString()
          });
        }
        break;

      default:
        throw new Error('INVALID_ACTION');
    }

    logger.info(`Meeting control: ${control.action} on meeting ${meetingId} by ${userId}`);
  }

  /**
   * Raise hand
   */
  async raiseHand(meetingId: string, userId: string): Promise<void> {
    await this.dbService.updateParticipant(meetingId, userId, {
      hasRaisedHand: true
    });
    
    // Emit WebSocket event
    if (this.wsService) {
      this.wsService.handRaised(meetingId, userId);
    }
    
    logger.info(`User ${userId} raised hand in meeting ${meetingId}`);
  }

  /**
   * Lower hand
   */
  async lowerHand(meetingId: string, userId: string): Promise<void> {
    await this.dbService.updateParticipant(meetingId, userId, {
      hasRaisedHand: false
    });
    
    // Emit WebSocket event
    if (this.wsService) {
      this.wsService.handLowered(meetingId, userId);
    }
  }

  /**
   * Start background music
   * Only host, co-host, or music_host can start music
   */
  async startBackgroundMusic(
    meetingId: string,
    userId: string,
    data: StartMusicDto
  ): Promise<BackgroundMusicState> {
    const meeting = await this.dbService.getMeeting(meetingId);
    if (!meeting) {
      throw new Error('MEETING_NOT_FOUND');
    }

    // Check permissions
    const participant = await this.dbService.getParticipant(meetingId, userId);
    if (!participant) {
      throw new Error('NOT_PARTICIPANT');
    }

    const canControlMusic = 
      participant.role === MeetingRole.HOST ||
      participant.role === MeetingRole.CO_HOST ||
      participant.role === MeetingRole.MUSIC_HOST;

    if (!canControlMusic) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }

    // Create music state
    const musicState: BackgroundMusicState = {
      isEnabled: true,
      source: data.source,
      trackUrl: data.trackUrl,
      volume: data.volume || 50,
      isLooping: data.isLooping !== undefined ? data.isLooping : true,
      startedBy: userId,
      startedAt: new Date()
    };

    await this.dbService.updateMeeting(meetingId, {
      backgroundMusicEnabled: true
    });

    // Persist music state (in-memory for now; swap to Redis later)
    await this.musicRepo.set(meetingId, musicState);

    // Emit WebSocket event
    if (this.wsService) {
      this.wsService.musicStarted(meetingId, userId, musicState);
    }
    
    logger.info(`Background music started in meeting ${meetingId} by user ${userId}`);
    
    return musicState;
  }

  /**
   * Stop background music
   */
  async stopBackgroundMusic(meetingId: string, userId: string): Promise<void> {
    const meeting = await this.dbService.getMeeting(meetingId);
    if (!meeting) {
      throw new Error('MEETING_NOT_FOUND');
    }

    // Check permissions
    const participant = await this.dbService.getParticipant(meetingId, userId);
    if (!participant) {
      throw new Error('NOT_PARTICIPANT');
    }

    const canControlMusic = 
      participant.role === MeetingRole.HOST ||
      participant.role === MeetingRole.CO_HOST ||
      participant.role === MeetingRole.MUSIC_HOST;

    if (!canControlMusic) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }

    await this.dbService.updateMeeting(meetingId, {
      backgroundMusicEnabled: false
    });

    // Clear stored music state
    await this.musicRepo.delete(meetingId);

    // Emit WebSocket event
    if (this.wsService) {
      this.wsService.musicStopped(meetingId, userId);
    }

    logger.info(`Background music stopped in meeting ${meetingId} by user ${userId}`);
  }

  /**
   * Update music volume
   */
  async updateMusicVolume(
    meetingId: string,
    userId: string,
    data: UpdateMusicVolumeDto
  ): Promise<void> {
    const meeting = await this.dbService.getMeeting(meetingId);
    if (!meeting) {
      throw new Error('MEETING_NOT_FOUND');
    }

    // Check permissions
    const participant = await this.dbService.getParticipant(meetingId, userId);
    if (!participant) {
      throw new Error('NOT_PARTICIPANT');
    }

    const canControlMusic = 
      participant.role === MeetingRole.HOST ||
      participant.role === MeetingRole.CO_HOST ||
      participant.role === MeetingRole.MUSIC_HOST;

    if (!canControlMusic) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }

    // Validate volume (0-100)
    if (data.volume < 0 || data.volume > 100) {
      throw new Error('INVALID_VOLUME');
    }

    // Update stored state
    const updated = await this.musicRepo.updateVolume(meetingId, data.volume);
    if (!updated) {
      throw new Error('MUSIC_NOT_ACTIVE');
    }

    // Emit WebSocket event
    if (this.wsService) {
      this.wsService.musicVolumeUpdated(meetingId, userId, data.volume);
    }
    
    logger.info(`Music volume updated to ${data.volume}% in meeting ${meetingId} by user ${userId}`);
  }

  /**
   * Get current music state
   */
  async getMusicState(meetingId: string): Promise<BackgroundMusicState | null> {
    const meeting = await this.dbService.getMeeting(meetingId);
    if (!meeting) {
      throw new Error('MEETING_NOT_FOUND');
    }

    const state = await this.musicRepo.get(meetingId);
    if (!state) {
      return null;
    }

    return state;
  }

  /**
   * Start recording (placeholder hook)
   */
  async startRecording(meetingId: string, userId: string): Promise<void> {
    const meeting = await this.dbService.getMeeting(meetingId);
    if (!meeting) {
      throw new Error('MEETING_NOT_FOUND');
    }

    const participant = await this.dbService.getParticipant(meetingId, userId);
    if (!participant) {
      throw new Error('NOT_PARTICIPANT');
    }

    const canControl = participant.role === MeetingRole.HOST || participant.role === MeetingRole.CO_HOST;
    if (!canControl) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }

    await this.dbService.updateMeeting(meetingId, { recordingEnabled: true });

    if (this.wsService) {
      this.wsService.recordingStarted(meetingId, userId);
    }

    logger.info(`Recording started for meeting ${meetingId} by ${userId}`);
  }

  /**
   * Stop recording (placeholder hook)
   */
  async stopRecording(meetingId: string, userId: string): Promise<void> {
    const meeting = await this.dbService.getMeeting(meetingId);
    if (!meeting) {
      throw new Error('MEETING_NOT_FOUND');
    }

    const participant = await this.dbService.getParticipant(meetingId, userId);
    if (!participant) {
      throw new Error('NOT_PARTICIPANT');
    }

    const canControl = participant.role === MeetingRole.HOST || participant.role === MeetingRole.CO_HOST;
    if (!canControl) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }

    await this.dbService.updateMeeting(meetingId, { recordingEnabled: false });

    if (this.wsService) {
      this.wsService.recordingStopped(meetingId, userId);
    }

    logger.info(`Recording stopped for meeting ${meetingId} by ${userId}`);
  }

  /**
   * Start screen share (placeholder hook)
   */
  async startScreenshare(meetingId: string, userId: string): Promise<void> {
    const meeting = await this.dbService.getMeeting(meetingId);
    if (!meeting) {
      throw new Error('MEETING_NOT_FOUND');
    }

    const participant = await this.dbService.getParticipant(meetingId, userId);
    if (!participant) {
      throw new Error('NOT_PARTICIPANT');
    }

    const canShare =
      participant.role === MeetingRole.HOST ||
      participant.role === MeetingRole.CO_HOST ||
      participant.role === MeetingRole.SPEAKER;

    if (!canShare) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }

    if (this.wsService) {
      this.wsService.screenshareStarted(meetingId, userId);
    }

    logger.info(`Screenshare started for meeting ${meetingId} by ${userId}`);
  }

  /**
   * Stop screen share (placeholder hook)
   */
  async stopScreenshare(meetingId: string, userId: string): Promise<void> {
    const meeting = await this.dbService.getMeeting(meetingId);
    if (!meeting) {
      throw new Error('MEETING_NOT_FOUND');
    }

    const participant = await this.dbService.getParticipant(meetingId, userId);
    if (!participant) {
      throw new Error('NOT_PARTICIPANT');
    }

    const canShare =
      participant.role === MeetingRole.HOST ||
      participant.role === MeetingRole.CO_HOST ||
      participant.role === MeetingRole.SPEAKER;

    if (!canShare) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }

    if (this.wsService) {
      this.wsService.screenshareStopped(meetingId, userId);
    }

    logger.info(`Screenshare stopped for meeting ${meetingId} by ${userId}`);
  }

  /**
   * Share resource (placeholder hook)
   */
  async shareResource(meetingId: string, userId: string, resource: ShareResourceDto): Promise<void> {
    const meeting = await this.dbService.getMeeting(meetingId);
    if (!meeting) {
      throw new Error('MEETING_NOT_FOUND');
    }

    const participant = await this.dbService.getParticipant(meetingId, userId);
    if (!participant) {
      throw new Error('NOT_PARTICIPANT');
    }

    // Allow any participant for now; tighten later if needed

    if (this.wsService) {
      this.wsService.resourceShared(meetingId, userId, resource);
    }

    logger.info(`Resource shared in meeting ${meetingId} by ${userId}: ${resource.name}`);
  }
}

