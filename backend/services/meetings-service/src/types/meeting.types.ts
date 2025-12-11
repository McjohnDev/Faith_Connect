/**
 * Meeting Types
 */

export enum MeetingRole {
  HOST = 'host',
  CO_HOST = 'co_host',
  SPEAKER = 'speaker',
  LISTENER = 'listener',
  MUSIC_HOST = 'music_host'
}

export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  hostId: string;
  channelName: string; // Agora channel name
  agoraAppId: string;
  status: MeetingStatus;
  scheduledStart?: Date;
  startedAt?: Date;
  endedAt?: Date;
  maxParticipants?: number;
  isLocked: boolean;
  backgroundMusicEnabled: boolean;
  recordingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  userId: string;
  role: MeetingRole;
  isMuted: boolean;
  hasRaisedHand: boolean;
  joinedAt: Date;
  leftAt?: Date;
  agoraUid?: number; // Agora user ID
}

export interface CreateMeetingDto {
  title: string;
  description?: string;
  scheduledStart?: Date;
  maxParticipants?: number;
  backgroundMusicEnabled?: boolean;
  recordingEnabled?: boolean;
}

export interface JoinMeetingDto {
  meetingId: string;
  role?: MeetingRole;
}

export interface UpdateMeetingDto {
  title?: string;
  description?: string;
  status?: MeetingStatus;
  isLocked?: boolean;
  backgroundMusicEnabled?: boolean;
  recordingEnabled?: boolean;
}

export interface MeetingControlDto {
  action: 'mute' | 'unmute' | 'remove' | 'promote' | 'demote' | 'lock' | 'unlock';
  participantId?: string;
  role?: MeetingRole;
}

export type ResourceShareType = 'pdf' | 'image' | 'link' | 'video' | 'audio' | 'other';

export interface ShareResourceDto {
  type: ResourceShareType;
  url: string;
  name: string;
  description?: string;
}

export interface BackgroundMusicState {
  isEnabled: boolean;
  source: 'upload' | 'stream' | 'url';
  trackUrl?: string;
  volume: number; // 0-100
  isLooping: boolean;
  startedBy?: string; // userId
  startedAt?: Date;
}

export interface StartMusicDto {
  source: 'upload' | 'stream' | 'url';
  trackUrl: string;
  volume?: number; // 0-100, default 50
  isLooping?: boolean; // default true
}

export interface UpdateMusicVolumeDto {
  volume: number; // 0-100
}

export interface RecordingState {
  isRecording: boolean;
  recordingId?: string;
  startedBy?: string; // userId
  startedAt?: Date;
  stoppedAt?: Date;
  storageUrl?: string; // URL to stored recording file
  duration?: number; // Duration in seconds
  fileSize?: number; // File size in bytes
}

export enum RecordingStatus {
  STARTING = 'starting',
  RECORDING = 'recording',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  FAILED = 'failed'
}

