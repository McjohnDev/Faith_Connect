import { BackgroundMusicState } from '../types/meeting.types';

/**
 * Lightweight in-memory music state store (per meeting).
 * Can be swapped for Redis-backed storage later.
 */
export class MusicStateRepository {
  private states: Map<string, BackgroundMusicState> = new Map();

  async set(meetingId: string, state: BackgroundMusicState): Promise<void> {
    this.states.set(meetingId, state);
  }

  async get(meetingId: string): Promise<BackgroundMusicState | null> {
    return this.states.get(meetingId) || null;
  }

  async delete(meetingId: string): Promise<void> {
    this.states.delete(meetingId);
  }

  async updateVolume(meetingId: string, volume: number): Promise<BackgroundMusicState | null> {
    const current = this.states.get(meetingId);
    if (!current) return null;
    const next: BackgroundMusicState = { ...current, volume };
    this.states.set(meetingId, next);
    return next;
  }
}

