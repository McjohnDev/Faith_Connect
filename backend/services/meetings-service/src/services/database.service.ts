/**
 * Database Service for Meetings
 * Handles meeting and participant data persistence
 */

import { Pool, createPool } from 'mysql2/promise';
import { Pool as PgPool } from 'pg';
import { logger } from '../utils/logger';
import { Meeting, MeetingParticipant, MeetingStatus, UpdateMeetingDto } from '../types/meeting.types';

export class DatabaseService {
  private mysqlPool?: Pool;
  private pgPool?: PgPool;
  private dbType: 'mysql' | 'postgresql';

  constructor() {
    this.dbType = process.env.NODE_ENV === 'production' ? 'postgresql' : 'mysql';

    if (this.dbType === 'mysql') {
      this.mysqlPool = createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'faithconnect_test',
        waitForConnections: true,
        connectionLimit: 10
      });
      logger.info('MySQL connection pool created for meetings');
    } else {
      this.pgPool = new PgPool({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || '',
        database: process.env.POSTGRES_DATABASE || 'faithconnect',
        max: 20
      });
      logger.info('PostgreSQL connection pool created for meetings');
    }
  }

  async createMeeting(meeting: Meeting): Promise<void> {
    const query = this.dbType === 'mysql'
      ? `INSERT INTO meetings (id, title, description, host_id, channel_name, agora_app_id, status, scheduled_start, max_participants, is_locked, background_music_enabled, recording_enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO meetings (id, title, description, host_id, channel_name, agora_app_id, status, scheduled_start, max_participants, is_locked, background_music_enabled, recording_enabled, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`;

    const params = [
      meeting.id,
      meeting.title,
      meeting.description || null,
      meeting.hostId,
      meeting.channelName,
      meeting.agoraAppId,
      meeting.status,
      meeting.scheduledStart || null,
      meeting.maxParticipants || null,
      meeting.isLocked,
      meeting.backgroundMusicEnabled,
      meeting.recordingEnabled,
      meeting.createdAt,
      meeting.updatedAt
    ];

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, params);
    } else if (this.pgPool) {
      await this.pgPool.query(query, params);
    }
  }

  async getMeeting(meetingId: string): Promise<Meeting | null> {
    const query = this.dbType === 'mysql'
      ? 'SELECT * FROM meetings WHERE id = ?'
      : 'SELECT * FROM meetings WHERE id = $1';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, [meetingId]);
      const meetings = rows as any[];
      return meetings.length > 0 ? this.mapToMeeting(meetings[0]) : null;
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, [meetingId]);
      return result.rows.length > 0 ? this.mapToMeeting(result.rows[0]) : null;
    }
    return null;
  }

  async listMeetings(filters?: {
    status?: MeetingStatus;
    hostId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Meeting[]> {
    let query = 'SELECT * FROM meetings WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      if (this.dbType === 'mysql') {
        query += ' AND status = ?';
        params.push(filters.status);
      } else {
        query += ` AND status = $${paramIndex++}`;
        params.push(filters.status);
      }
    }

    if (filters?.hostId) {
      if (this.dbType === 'mysql') {
        query += ' AND host_id = ?';
        params.push(filters.hostId);
      } else {
        query += ` AND host_id = $${paramIndex++}`;
        params.push(filters.hostId);
      }
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      if (this.dbType === 'mysql') {
        query += ' LIMIT ?';
        params.push(filters.limit);
      } else {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }
    }

    if (filters?.offset) {
      if (this.dbType === 'mysql') {
        query += ' OFFSET ?';
        params.push(filters.offset);
      } else {
        query += ` OFFSET $${paramIndex++}`;
        params.push(filters.offset);
      }
    }

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, params);
      return (rows as any[]).map(row => this.mapToMeeting(row));
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, params);
      return result.rows.map(row => this.mapToMeeting(row));
    }
    return [];
  }

  async updateMeeting(meetingId: string, update: UpdateMeetingDto): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (update.title !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('title = ?');
        params.push(update.title);
      } else {
        updates.push(`title = $${paramIndex++}`);
        params.push(update.title);
      }
    }

    if (update.description !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('description = ?');
        params.push(update.description);
      } else {
        updates.push(`description = $${paramIndex++}`);
        params.push(update.description);
      }
    }

    if (update.status !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('status = ?');
        params.push(update.status);
        if (update.status === MeetingStatus.ACTIVE) {
          updates.push('started_at = NOW()');
        } else if (update.status === MeetingStatus.ENDED) {
          updates.push('ended_at = NOW()');
        }
      } else {
        updates.push(`status = $${paramIndex++}`);
        params.push(update.status);
        if (update.status === MeetingStatus.ACTIVE) {
          updates.push('started_at = CURRENT_TIMESTAMP');
        } else if (update.status === MeetingStatus.ENDED) {
          updates.push('ended_at = CURRENT_TIMESTAMP');
        }
      }
    }

    if (update.isLocked !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('is_locked = ?');
        params.push(update.isLocked);
      } else {
        updates.push(`is_locked = $${paramIndex++}`);
        params.push(update.isLocked);
      }
    }

    if (update.backgroundMusicEnabled !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('background_music_enabled = ?');
        params.push(update.backgroundMusicEnabled);
      } else {
        updates.push(`background_music_enabled = $${paramIndex++}`);
        params.push(update.backgroundMusicEnabled);
      }
    }

    if (update.recordingEnabled !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('recording_enabled = ?');
        params.push(update.recordingEnabled);
      } else {
        updates.push(`recording_enabled = $${paramIndex++}`);
        params.push(update.recordingEnabled);
      }
    }

    if (updates.length === 0) return;

    updates.push(this.dbType === 'mysql' ? 'updated_at = NOW()' : 'updated_at = CURRENT_TIMESTAMP');

    const query = this.dbType === 'mysql'
      ? `UPDATE meetings SET ${updates.join(', ')} WHERE id = ?`
      : `UPDATE meetings SET ${updates.join(', ')} WHERE id = $${paramIndex}`;

    params.push(meetingId);

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, params);
    } else if (this.pgPool) {
      await this.pgPool.query(query, params);
    }
  }

  async addParticipant(participant: MeetingParticipant): Promise<void> {
    const query = this.dbType === 'mysql'
      ? `INSERT INTO meeting_participants (id, meeting_id, user_id, role, is_muted, has_raised_hand, joined_at, agora_uid)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO meeting_participants (id, meeting_id, user_id, role, is_muted, has_raised_hand, joined_at, agora_uid)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;

    const params = [
      participant.id,
      participant.meetingId,
      participant.userId,
      participant.role,
      participant.isMuted,
      participant.hasRaisedHand,
      participant.joinedAt,
      participant.agoraUid || null
    ];

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, params);
    } else if (this.pgPool) {
      await this.pgPool.query(query, params);
    }
  }

  async getParticipant(meetingId: string, userId: string): Promise<MeetingParticipant | null> {
    const query = this.dbType === 'mysql'
      ? 'SELECT * FROM meeting_participants WHERE meeting_id = ? AND user_id = ? AND left_at IS NULL'
      : 'SELECT * FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2 AND left_at IS NULL';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, [meetingId, userId]);
      const participants = rows as any[];
      return participants.length > 0 ? this.mapToParticipant(participants[0]) : null;
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, [meetingId, userId]);
      return result.rows.length > 0 ? this.mapToParticipant(result.rows[0]) : null;
    }
    return null;
  }

  async getMeetingParticipantCount(meetingId: string): Promise<number> {
    const query = this.dbType === 'mysql'
      ? 'SELECT COUNT(*) as count FROM meeting_participants WHERE meeting_id = ? AND left_at IS NULL'
      : 'SELECT COUNT(*) as count FROM meeting_participants WHERE meeting_id = $1 AND left_at IS NULL';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, [meetingId]);
      return (rows as any[])[0].count;
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, [meetingId]);
      return parseInt(result.rows[0].count);
    }
    return 0;
  }

  async getMeetingParticipants(meetingId: string): Promise<MeetingParticipant[]> {
    const query = this.dbType === 'mysql'
      ? 'SELECT * FROM meeting_participants WHERE meeting_id = ? AND left_at IS NULL ORDER BY joined_at ASC'
      : 'SELECT * FROM meeting_participants WHERE meeting_id = $1 AND left_at IS NULL ORDER BY joined_at ASC';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, [meetingId]);
      return (rows as any[]).map(row => this.mapToParticipant(row));
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, [meetingId]);
      return result.rows.map(row => this.mapToParticipant(row));
    }
    return [];
  }

  async updateParticipant(
    meetingId: string,
    userId: string,
    update: Partial<MeetingParticipant>
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (update.isMuted !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('is_muted = ?');
        params.push(update.isMuted);
      } else {
        updates.push(`is_muted = $${paramIndex++}`);
        params.push(update.isMuted);
      }
    }

    if (update.hasRaisedHand !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('has_raised_hand = ?');
        params.push(update.hasRaisedHand);
      } else {
        updates.push(`has_raised_hand = $${paramIndex++}`);
        params.push(update.hasRaisedHand);
      }
    }

    if (update.role !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('role = ?');
        params.push(update.role);
      } else {
        updates.push(`role = $${paramIndex++}`);
        params.push(update.role);
      }
    }

    if (updates.length === 0) return;

    const query = this.dbType === 'mysql'
      ? `UPDATE meeting_participants SET ${updates.join(', ')} WHERE meeting_id = ? AND user_id = ?`
      : `UPDATE meeting_participants SET ${updates.join(', ')} WHERE meeting_id = $${paramIndex++} AND user_id = $${paramIndex}`;

    params.push(meetingId, userId);

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, params);
    } else if (this.pgPool) {
      await this.pgPool.query(query, params);
    }
  }

  async removeParticipant(meetingId: string, userId: string): Promise<void> {
    const query = this.dbType === 'mysql'
      ? 'UPDATE meeting_participants SET left_at = NOW() WHERE meeting_id = ? AND user_id = ?'
      : 'UPDATE meeting_participants SET left_at = CURRENT_TIMESTAMP WHERE meeting_id = $1 AND user_id = $2';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, [meetingId, userId]);
    } else if (this.pgPool) {
      await this.pgPool.query(query, [meetingId, userId]);
    }
  }

  private mapToMeeting(row: any): Meeting {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      hostId: row.host_id || row.hostId,
      channelName: row.channel_name || row.channelName,
      agoraAppId: row.agora_app_id || row.agoraAppId,
      status: row.status,
      scheduledStart: row.scheduled_start ? new Date(row.scheduled_start) : undefined,
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      endedAt: row.ended_at ? new Date(row.ended_at) : undefined,
      maxParticipants: row.max_participants || row.maxParticipants,
      isLocked: row.is_locked || row.isLocked,
      backgroundMusicEnabled: row.background_music_enabled || row.backgroundMusicEnabled,
      recordingEnabled: row.recording_enabled || row.recordingEnabled,
      createdAt: new Date(row.created_at || row.createdAt),
      updatedAt: new Date(row.updated_at || row.updatedAt)
    };
  }

  private mapToParticipant(row: any): MeetingParticipant {
    return {
      id: row.id,
      meetingId: row.meeting_id || row.meetingId,
      userId: row.user_id || row.userId,
      role: row.role,
      isMuted: row.is_muted || row.isMuted,
      hasRaisedHand: row.has_raised_hand || row.hasRaisedHand,
      joinedAt: new Date(row.joined_at || row.joinedAt),
      leftAt: row.left_at ? new Date(row.left_at) : undefined,
      agoraUid: row.agora_uid || row.agoraUid
    };
  }

  // Recording management methods
  async createRecording(recording: {
    id: string;
    meetingId: string;
    recordingId: string;
    startedBy: string;
    startedAt: Date;
  }): Promise<void> {
    const query = this.dbType === 'mysql'
      ? `INSERT INTO recordings (id, meeting_id, recording_id, started_by, started_at, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'processing', ?, ?)`
      : `INSERT INTO recordings (id, meeting_id, recording_id, started_by, started_at, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'processing', $6, $7)`;

    const params = [
      recording.id,
      recording.meetingId,
      recording.recordingId,
      recording.startedBy,
      recording.startedAt,
      recording.startedAt,
      recording.startedAt
    ];

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, params);
    } else if (this.pgPool) {
      await this.pgPool.query(query, params);
    }
  }

  async updateRecording(recordingId: string, update: {
    storageUrl?: string;
    storageKey?: string;
    duration?: number;
    fileSize?: number;
    status?: 'processing' | 'completed' | 'failed';
    stoppedAt?: Date;
    completedAt?: Date;
    errorMessage?: string;
  }): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (update.storageUrl !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('storage_url = ?');
        params.push(update.storageUrl);
      } else {
        updates.push(`storage_url = $${paramIndex++}`);
        params.push(update.storageUrl);
      }
    }

    if (update.storageKey !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('storage_key = ?');
        params.push(update.storageKey);
      } else {
        updates.push(`storage_key = $${paramIndex++}`);
        params.push(update.storageKey);
      }
    }

    if (update.duration !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('duration = ?');
        params.push(update.duration);
      } else {
        updates.push(`duration = $${paramIndex++}`);
        params.push(update.duration);
      }
    }

    if (update.fileSize !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('file_size = ?');
        params.push(update.fileSize);
      } else {
        updates.push(`file_size = $${paramIndex++}`);
        params.push(update.fileSize);
      }
    }

    if (update.status !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('status = ?');
        params.push(update.status);
      } else {
        updates.push(`status = $${paramIndex++}`);
        params.push(update.status);
      }
    }

    if (update.stoppedAt !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('stopped_at = ?');
        params.push(update.stoppedAt);
      } else {
        updates.push(`stopped_at = $${paramIndex++}`);
        params.push(update.stoppedAt);
      }
    }

    if (update.completedAt !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('completed_at = ?');
        params.push(update.completedAt);
      } else {
        updates.push(`completed_at = $${paramIndex++}`);
        params.push(update.completedAt);
      }
    }

    if (update.errorMessage !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('error_message = ?');
        params.push(update.errorMessage);
      } else {
        updates.push(`error_message = $${paramIndex++}`);
        params.push(update.errorMessage);
      }
    }

    if (updates.length === 0) return;

    updates.push(this.dbType === 'mysql' ? 'updated_at = NOW()' : 'updated_at = CURRENT_TIMESTAMP');

    const query = this.dbType === 'mysql'
      ? `UPDATE recordings SET ${updates.join(', ')} WHERE recording_id = ?`
      : `UPDATE recordings SET ${updates.join(', ')} WHERE recording_id = $${paramIndex}`;

    params.push(recordingId);

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, params);
    } else if (this.pgPool) {
      await this.pgPool.query(query, params);
    }
  }

  async getRecording(recordingId: string): Promise<any | null> {
    const query = this.dbType === 'mysql'
      ? 'SELECT * FROM recordings WHERE recording_id = ?'
      : 'SELECT * FROM recordings WHERE recording_id = $1';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, [recordingId]);
      const recordings = rows as any[];
      return recordings.length > 0 ? recordings[0] : null;
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, [recordingId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    }
    return null;
  }

  async listRecordings(filters?: {
    meetingId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    let query = 'SELECT * FROM recordings WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.meetingId) {
      if (this.dbType === 'mysql') {
        query += ' AND meeting_id = ?';
        params.push(filters.meetingId);
      } else {
        query += ` AND meeting_id = $${paramIndex++}`;
        params.push(filters.meetingId);
      }
    }

    if (filters?.status) {
      if (this.dbType === 'mysql') {
        query += ' AND status = ?';
        params.push(filters.status);
      } else {
        query += ` AND status = $${paramIndex++}`;
        params.push(filters.status);
      }
    }

    query += ' ORDER BY started_at DESC';

    if (filters?.limit) {
      if (this.dbType === 'mysql') {
        query += ' LIMIT ?';
        params.push(filters.limit);
      } else {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }
    }

    if (filters?.offset) {
      if (this.dbType === 'mysql') {
        query += ' OFFSET ?';
        params.push(filters.offset);
      } else {
        query += ` OFFSET $${paramIndex++}`;
        params.push(filters.offset);
      }
    }

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, params);
      return rows as any[];
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, params);
      return result.rows;
    }
    return [];
  }
}

