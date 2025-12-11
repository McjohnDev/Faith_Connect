/**
 * Storage Service
 * Stub for recording file storage (S3, local, etc.)
 */

import { logger } from '../utils/logger';

export interface StorageAdapter {
  uploadFile(filePath: string, destination: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
  getFileUrl(fileKey: string): Promise<string>;
}

/**
 * In-memory stub storage adapter
 * In production, this would be replaced with S3, Azure Blob, etc.
 */
export class StubStorageAdapter implements StorageAdapter {
  private files: Map<string, string> = new Map(); // fileKey -> fileUrl

  async uploadFile(filePath: string, destination: string): Promise<string> {
    // Stub: generate a mock URL
    const fileUrl = `https://storage.example.com/recordings/${destination}`;
    this.files.set(destination, fileUrl);
    logger.info(`Stub storage: uploaded ${filePath} to ${fileUrl}`);
    return fileUrl;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // Stub: remove from map
    for (const [key, url] of this.files.entries()) {
      if (url === fileUrl) {
        this.files.delete(key);
        logger.info(`Stub storage: deleted ${fileUrl}`);
        return;
      }
    }
    logger.warn(`Stub storage: file not found ${fileUrl}`);
  }

  async getFileUrl(fileKey: string): Promise<string> {
    const url = this.files.get(fileKey);
    if (!url) {
      throw new Error('FILE_NOT_FOUND');
    }
    return url;
  }
}

export class StorageService {
  private adapter: StorageAdapter;

  constructor(adapter?: StorageAdapter) {
    this.adapter = adapter || new StubStorageAdapter();
  }

  async uploadRecording(meetingId: string, recordingId: string, filePath: string): Promise<string> {
    const destination = `meetings/${meetingId}/recordings/${recordingId}.mp4`;
    return await this.adapter.uploadFile(filePath, destination);
  }

  async deleteRecording(storageUrl: string): Promise<void> {
    await this.adapter.deleteFile(storageUrl);
  }

  async getRecordingUrl(meetingId: string, recordingId: string): Promise<string> {
    const fileKey = `meetings/${meetingId}/recordings/${recordingId}.mp4`;
    return await this.adapter.getFileUrl(fileKey);
  }
}

