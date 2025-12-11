/**
 * Storage Service
 * Handles recording file storage (S3, local, etc.)
 */

import { logger } from '../utils/logger';
import { S3StorageAdapter, S3Config } from './s3-storage.service';

export interface StorageAdapter {
  uploadFile(filePath: string, destination: string, contentType?: string): Promise<string>;
  uploadFromUrl(sourceUrl: string, destination: string, contentType?: string): Promise<string>;
  deleteFile(storageKey: string): Promise<void>;
  getFileUrl(fileKey: string): Promise<string>;
  getPresignedUrl(storageKey: string, expiresIn?: number): Promise<string>;
  extractKeyFromUrl(url: string): string;
}

/**
 * In-memory stub storage adapter
 * Used when S3 is not configured
 */
export class StubStorageAdapter implements StorageAdapter {
  private files: Map<string, string> = new Map(); // fileKey -> fileUrl

  async uploadFile(filePath: string, destination: string, _contentType?: string): Promise<string> {
    // Stub: generate a mock URL
    const fileUrl = `https://storage.example.com/recordings/${destination}`;
    this.files.set(destination, fileUrl);
    logger.info(`Stub storage: uploaded ${filePath} to ${fileUrl}`);
    return fileUrl;
  }

  async uploadFromUrl(sourceUrl: string, destination: string, _contentType?: string): Promise<string> {
    // Stub: generate a mock URL
    const fileUrl = `https://storage.example.com/recordings/${destination}`;
    this.files.set(destination, fileUrl);
    logger.info(`Stub storage: uploaded from ${sourceUrl} to ${fileUrl}`);
    return fileUrl;
  }

  async deleteFile(storageKey: string): Promise<void> {
    // Stub: remove from map
    this.files.delete(storageKey);
    logger.info(`Stub storage: deleted ${storageKey}`);
  }

  async getFileUrl(fileKey: string): Promise<string> {
    const url = this.files.get(fileKey);
    if (!url) {
      throw new Error('FILE_NOT_FOUND');
    }
    return url;
  }

  async getPresignedUrl(storageKey: string, _expiresIn?: number): Promise<string> {
    return this.getFileUrl(storageKey);
  }

  extractKeyFromUrl(url: string): string {
    // Extract key from stub URL
    const match = url.match(/https:\/\/storage\.example\.com\/recordings\/(.+)$/);
    if (!match) {
      throw new Error('Invalid storage URL format');
    }
    return match[1];
  }
}

export class StorageService {
  private adapter: StorageAdapter;

  constructor(adapter?: StorageAdapter) {
    if (adapter) {
      this.adapter = adapter;
    } else if (process.env.AWS_S3_BUCKET && process.env.AWS_REGION) {
      // Use S3 if configured
      const s3Config: S3Config = {
        region: process.env.AWS_REGION,
        bucket: process.env.AWS_S3_BUCKET,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      };
      this.adapter = new S3StorageAdapter(s3Config);
      logger.info('Using S3 storage adapter');
    } else {
      this.adapter = new StubStorageAdapter();
      logger.info('Using stub storage adapter (S3 not configured)');
    }
  }

  async uploadRecording(meetingId: string, recordingId: string, filePath: string): Promise<string> {
    const destination = `meetings/${meetingId}/recordings/${recordingId}.mp4`;
    return await this.adapter.uploadFile(filePath, destination, 'video/mp4');
  }

  async uploadRecordingFromUrl(meetingId: string, recordingId: string, sourceUrl: string): Promise<string> {
    const destination = `meetings/${meetingId}/recordings/${recordingId}.mp4`;
    return await this.adapter.uploadFromUrl(sourceUrl, destination, 'video/mp4');
  }

  async deleteRecording(storageKey: string): Promise<void> {
    await this.adapter.deleteFile(storageKey);
  }

  async getRecordingUrl(meetingId: string, recordingId: string): Promise<string> {
    const fileKey = `meetings/${meetingId}/recordings/${recordingId}.mp4`;
    return await this.adapter.getFileUrl(fileKey);
  }

  async getPresignedUrl(storageKey: string, expiresIn: number = 3600): Promise<string> {
    return await this.adapter.getPresignedUrl(storageKey, expiresIn);
  }

  extractStorageKey(url: string): string {
    return this.adapter.extractKeyFromUrl(url);
  }
}

