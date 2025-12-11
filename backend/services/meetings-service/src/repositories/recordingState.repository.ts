import { RecordingState } from '../types/meeting.types';

/**
 * Lightweight in-memory recording state store (per meeting).
 * Can be swapped for Redis-backed storage later.
 */
export class RecordingStateRepository {
  private states: Map<string, RecordingState> = new Map();

  async set(meetingId: string, state: RecordingState): Promise<void> {
    this.states.set(meetingId, state);
  }

  async get(meetingId: string): Promise<RecordingState | null> {
    return this.states.get(meetingId) || null;
  }

  async delete(meetingId: string): Promise<void> {
    this.states.delete(meetingId);
  }

  async update(meetingId: string, updates: Partial<RecordingState>): Promise<RecordingState | null> {
    const current = this.states.get(meetingId);
    if (!current) return null;
    const next: RecordingState = { ...current, ...updates };
    this.states.set(meetingId, next);
    return next;
  }
}

