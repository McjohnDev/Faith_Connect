/**
 * Storage Service for Feed
 * Handles image uploads for posts (S3, local, etc.)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';
// @ts-ignore - node-fetch types may not be available
import fetch from 'node-fetch';

export interface StorageAdapter {
  uploadFile(filePath: string, destination: string, contentType?: string): Promise<string>;
  uploadFromUrl(sourceUrl: string, destination: string, contentType?: string): Promise<string>;
  deleteFile(storageKey: string): Promise<void>;
  getFileUrl(fileKey: string): Promise<string>;
  getPresignedUploadUrl(fileKey: string, contentType: string, expiresIn?: number): Promise<string>;
}

export class S3StorageAdapter implements StorageAdapter {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_S3_REGION || 'us-east-1';
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || '';

    if (!this.bucketName) {
      logger.warn('AWS_S3_BUCKET_NAME is not set. S3 storage will not function.');
    }

    this.s3Client = new S3Client({ region: this.region });
  }

  async uploadFile(_filePath: string, destination: string, _contentType: string = 'image/jpeg'): Promise<string> {
    if (!this.bucketName) {
      throw new Error('S3 bucket name not configured.');
    }
    // In a real scenario, filePath would be a local path to read from
    // For this stub, we'll just log and return a mock URL
    logger.info(`S3 Stub: Uploading file from ${_filePath} to s3://${this.bucketName}/${destination}`);
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${destination}`;
  }

  async uploadFromUrl(sourceUrl: string, destination: string, contentType: string = 'image/jpeg'): Promise<string> {
    if (!this.bucketName) {
      throw new Error('S3 bucket name not configured.');
    }
    try {
      logger.info(`Downloading file from URL: ${sourceUrl} for S3 upload to ${destination}`);
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file from ${sourceUrl}: ${response.statusText}`);
      }
      const buffer = await response.buffer();

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: destination,
        Body: buffer,
        ContentType: contentType || response.headers.get('content-type') || 'image/jpeg',
      });

      await this.s3Client.send(command);
      const s3Url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${destination}`;
      logger.info(`S3: Uploaded file from URL ${sourceUrl} to ${s3Url}`);
      return s3Url;
    } catch (error) {
      logger.error(`S3 upload from URL failed for ${sourceUrl} to ${destination}:`, error);
      throw error;
    }
  }

  async deleteFile(storageKey: string): Promise<void> {
    if (!this.bucketName) {
      throw new Error('S3 bucket name not configured.');
    }
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
      });
      await this.s3Client.send(command);
      logger.info(`S3: Deleted file ${storageKey}`);
    } catch (error) {
      logger.error(`S3 delete failed for ${storageKey}:`, error);
      throw error;
    }
  }

  async getFileUrl(fileKey: string): Promise<string> {
    if (!this.bucketName) {
      throw new Error('S3 bucket name not configured.');
    }
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileKey}`;
  }

  async getPresignedUploadUrl(fileKey: string, contentType: string, expiresIn: number = 3600): Promise<string> {
    if (!this.bucketName) {
      throw new Error('S3 bucket name not configured.');
    }
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
}

export class StubStorageAdapter implements StorageAdapter {
  private files: Map<string, string> = new Map();

  async uploadFile(filePath: string, destination: string, _contentType?: string): Promise<string> {
    const fileUrl = `https://storage.example.com/feed/${destination}`;
    this.files.set(destination, fileUrl);
    logger.info(`Stub storage: uploaded ${filePath} to ${fileUrl}`);
    return fileUrl;
  }

  async uploadFromUrl(sourceUrl: string, destination: string, _contentType?: string): Promise<string> {
    const fileUrl = `https://storage.example.com/feed/${destination}`;
    this.files.set(destination, fileUrl);
    logger.info(`Stub storage: uploaded from ${sourceUrl} to ${fileUrl}`);
    return fileUrl;
  }

  async deleteFile(storageKey: string): Promise<void> {
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

  async getPresignedUploadUrl(fileKey: string, _contentType: string, _expiresIn?: number): Promise<string> {
    return this.getFileUrl(fileKey);
  }
}

export class StorageService {
  private adapter: StorageAdapter;
  private isS3Configured: boolean;

  constructor(adapter?: StorageAdapter) {
    this.isS3Configured = !!(process.env.AWS_S3_BUCKET_NAME && process.env.AWS_S3_REGION);
    this.adapter = adapter || (this.isS3Configured ? new S3StorageAdapter() : new StubStorageAdapter());
    if (this.isS3Configured) {
      logger.info('StorageService initialized with S3StorageAdapter');
    } else {
      logger.warn('StorageService initialized with StubStorageAdapter (S3 not configured)');
    }
  }

  async uploadPostImage(userId: string, postId: string, filePathOrUrl: string, contentType: string = 'image/jpeg'): Promise<string> {
    const destination = `feed/${userId}/posts/${postId}.${contentType.split('/')[1] || 'jpg'}`;
    if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
      return await this.adapter.uploadFromUrl(filePathOrUrl, destination, contentType);
    }
    return await this.adapter.uploadFile(filePathOrUrl, destination, contentType);
  }

  async deletePostImage(storageUrl: string): Promise<void> {
    // Extract key from URL
    const key = storageUrl.split('/').slice(-3).join('/'); // feed/userId/posts/fileId
    await this.adapter.deleteFile(key);
  }

  async getPresignedUploadUrl(userId: string, postId: string, contentType: string = 'image/jpeg'): Promise<string> {
    const fileKey = `feed/${userId}/posts/${postId}.${contentType.split('/')[1] || 'jpg'}`;
    return await this.adapter.getPresignedUploadUrl(fileKey, contentType);
  }
}

