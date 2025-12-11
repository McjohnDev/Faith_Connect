/**
 * WebSocket Service
 * Real-time events for meetings using Socket.io
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { MeetingParticipant, MeetingRole, BackgroundMusicState } from '../types/meeting.types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  meetingId?: string;
}

interface MeetingEventData {
  meetingId: string;
  userId: string;
  participant?: MeetingParticipant;
  role?: MeetingRole;
  musicState?: BackgroundMusicState;
  [key: string]: any;
}

export class WebSocketService {
  private io: SocketIOServer;
  private meetingRooms: Map<string, Set<string>> = new Map(); // meetingId -> Set of socketIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupHeartbeat();
  }

  /**
   * JWT Authentication Middleware
   */
  private setupMiddleware(): void {
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        logger.warn('WebSocket connection rejected: No token provided');
        return next(new Error('Authentication required'));
      }

      try {
        const jwtSecret = process.env.JWT_SECRET || 'change-me';
        const decoded = jwt.verify(token, jwtSecret) as any;
        
        if (!decoded.userId) {
          return next(new Error('Invalid token'));
        }

        socket.userId = decoded.userId;
        logger.info(`WebSocket authenticated: userId=${decoded.userId}`);
        next();
      } catch (error) {
        logger.warn('WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`WebSocket connected: ${socket.id}, userId: ${socket.userId}`);

      // Join meeting room
      socket.on('meeting:join', (data: { meetingId: string }) => {
        this.handleJoinMeeting(socket, data.meetingId);
      });

      // Leave meeting room
      socket.on('meeting:leave', (data: { meetingId: string }) => {
        this.handleLeaveMeeting(socket, data.meetingId);
      });

      // Disconnect handler
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Heartbeat/ping
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  /**
   * Join a meeting room
   */
  private handleJoinMeeting(socket: AuthenticatedSocket, meetingId: string): void {
    if (!socket.userId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    socket.join(`meeting:${meetingId}`);
    socket.meetingId = meetingId;

    // Track socket in meeting room
    if (!this.meetingRooms.has(meetingId)) {
      this.meetingRooms.set(meetingId, new Set());
    }
    this.meetingRooms.get(meetingId)!.add(socket.id);

    logger.info(`User ${socket.userId} joined meeting room: ${meetingId}`);
    socket.emit('meeting:joined', { meetingId });
  }

  /**
   * Leave a meeting room
   */
  private handleLeaveMeeting(socket: AuthenticatedSocket, meetingId: string): void {
    socket.leave(`meeting:${meetingId}`);
    
    const room = this.meetingRooms.get(meetingId);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) {
        this.meetingRooms.delete(meetingId);
      }
    }

    logger.info(`User ${socket.userId} left meeting room: ${meetingId}`);
    socket.emit('meeting:left', { meetingId });
  }

  /**
   * Handle socket disconnect
   */
  private handleDisconnect(socket: AuthenticatedSocket): void {
    if (socket.meetingId) {
      const room = this.meetingRooms.get(socket.meetingId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
          this.meetingRooms.delete(socket.meetingId);
        }
      }
    }

    logger.info(`WebSocket disconnected: ${socket.id}, userId: ${socket.userId}`);
  }

  /**
   * Setup heartbeat to detect stale connections
   */
  private setupHeartbeat(): void {
    setInterval(() => {
      // Socket.io handles heartbeat internally via ping/pong
      // This interval can be used for custom connection health checks if needed
      const connectedCount = this.io.sockets.sockets.size;
      if (connectedCount > 0) {
        logger.debug(`WebSocket heartbeat: ${connectedCount} connected sockets`);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Emit event to all participants in a meeting
   */
  emitToMeeting(meetingId: string, event: string, data: MeetingEventData): void {
    this.io.to(`meeting:${meetingId}`).emit(event, data);
    logger.info(`Emitted ${event} to meeting ${meetingId}`, { participants: this.meetingRooms.get(meetingId)?.size || 0 });
  }

  /**
   * Emit event to specific user
   */
  emitToUser(userId: string, event: string, data: any): void {
    this.io.sockets.sockets.forEach((socket: AuthenticatedSocket) => {
      if (socket.userId === userId) {
        socket.emit(event, data);
      }
    });
  }

  /**
   * Participant joined meeting
   */
  participantJoined(meetingId: string, participant: MeetingParticipant): void {
    this.emitToMeeting(meetingId, 'meeting:participant-joined', {
      meetingId,
      userId: participant.userId,
      participant,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Participant left meeting
   */
  participantLeft(meetingId: string, userId: string): void {
    this.emitToMeeting(meetingId, 'meeting:participant-left', {
      meetingId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Hand raised
   */
  handRaised(meetingId: string, userId: string): void {
    this.emitToMeeting(meetingId, 'meeting:hand-raised', {
      meetingId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Hand lowered
   */
  handLowered(meetingId: string, userId: string): void {
    this.emitToMeeting(meetingId, 'meeting:hand-lowered', {
      meetingId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Host promoted
   */
  hostPromoted(meetingId: string, userId: string, role: MeetingRole): void {
    this.emitToMeeting(meetingId, 'meeting:host-promoted', {
      meetingId,
      userId,
      role,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Recording started
   */
  recordingStarted(meetingId: string, userId: string): void {
    this.emitToMeeting(meetingId, 'meeting:recording-started', {
      meetingId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Recording stopped
   */
  recordingStopped(meetingId: string, userId: string): void {
    this.emitToMeeting(meetingId, 'meeting:recording-stopped', {
      meetingId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Music started
   */
  musicStarted(meetingId: string, userId: string, musicState: BackgroundMusicState): void {
    this.emitToMeeting(meetingId, 'meeting:music-started', {
      meetingId,
      userId,
      musicState,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Music stopped
   */
  musicStopped(meetingId: string, userId: string): void {
    this.emitToMeeting(meetingId, 'meeting:music-stopped', {
      meetingId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Music volume updated
   */
  musicVolumeUpdated(meetingId: string, userId: string, volume: number): void {
    this.emitToMeeting(meetingId, 'meeting:music-volume-updated', {
      meetingId,
      userId,
      volume,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Screen share started
   */
  screenshareStarted(meetingId: string, userId: string): void {
    this.emitToMeeting(meetingId, 'meeting:screenshare-started', {
      meetingId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Screen share stopped
   */
  screenshareStopped(meetingId: string, userId: string): void {
    this.emitToMeeting(meetingId, 'meeting:screenshare-stopped', {
      meetingId,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resource shared
   */
  resourceShared(meetingId: string, userId: string, resource: { type: string; url: string; name: string }): void {
    this.emitToMeeting(meetingId, 'meeting:resource-shared', {
      meetingId,
      userId,
      resource,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get Socket.io instance (for advanced usage)
   */
  getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Get number of participants in a meeting
   */
  getMeetingParticipantCount(meetingId: string): number {
    return this.meetingRooms.get(meetingId)?.size || 0;
  }
}

