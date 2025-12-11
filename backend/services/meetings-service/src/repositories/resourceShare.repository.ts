import { ResourceShare } from '../types/meeting.types';

/**
 * In-memory resource share repository.
 * Swap to persistent/Redis/DB storage when available.
 */
export class ResourceShareRepository {
  private resources: Map<string, ResourceShare[]> = new Map(); // meetingId -> shares

  async add(share: ResourceShare): Promise<void> {
    const list = this.resources.get(share.meetingId) || [];
    list.push(share);
    this.resources.set(share.meetingId, list);
  }

  async list(meetingId: string): Promise<ResourceShare[]> {
    return this.resources.get(meetingId) || [];
  }
}

