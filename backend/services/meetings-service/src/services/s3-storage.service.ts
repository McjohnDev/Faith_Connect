/**
 * S3 Storage Service
 * AWS S3 integration for recording storage
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';

export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export class S3StorageAdapter {
  private s3Client: S3Client;
  private bucket: string;

  constructor(config: S3Config) {
    const clientConfig: any = {
      region: config.region
    };

    // Only add credentials if provided (for local dev, can use IAM roles)
    if (config.accessKeyId && config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      };
    }

    this.s3Client = new S3Client(clientConfig);
    this.bucket = config.bucket;
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(filePath: string, destination: string, contentType: string = 'video/mp4'): Promise<string> {
    try {
      // In production, filePath would be a local file path or buffer
      // For now, we'll handle the case where we get a URL from Agora and need to download/upload
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: destination,
        ContentType: contentType,
        // In production, you'd read the file from filePath
        // Body: fs.readFileSync(filePath)
      });

      await this.s3Client.send(command);

      // Return the S3 URL
      const url = `https://${this.bucket}.s3.${this.s3Client.config.region}.amazonaws.com/${destination}`;
      logger.info(`File uploaded to S3: ${url}`);
      return url;
    } catch (error: any) {
      logger.error('S3 upload error:', error);
      throw new Error(`S3_UPLOAD_FAILED: ${error.message}`);
    }
  }

  /**
   * Upload from URL (for Agora Cloud Recording files)
   */
  async uploadFromUrl(sourceUrl: string, destination: string, contentType: string = 'video/mp4'): Promise<string> {
    try {
      // Download from source URL and upload to S3
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to download from ${sourceUrl}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: destination,
        ContentType: contentType,
        Body: Buffer.from(buffer)
      });

      await this.s3Client.send(command);

      const url = `https://${this.bucket}.s3.${this.s3Client.config.region}.amazonaws.com/${destination}`;
      logger.info(`File uploaded to S3 from URL: ${url}`);
      return url;
    } catch (error: any) {
      logger.error('S3 upload from URL error:', error);
      throw new Error(`S3_UPLOAD_FROM_URL_FAILED: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(storageKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey
      });

      await this.s3Client.send(command);
      logger.info(`File deleted from S3: ${storageKey}`);
    } catch (error: any) {
      logger.error('S3 delete error:', error);
      throw new Error(`S3_DELETE_FAILED: ${error.message}`);
    }
  }

  /**
   * Get a presigned URL for temporary access
   */
  async getPresignedUrl(storageKey: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storageKey
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error: any) {
      logger.error('S3 presigned URL error:', error);
      throw new Error(`S3_PRESIGNED_URL_FAILED: ${error.message}`);
    }
  }

  /**
   * Extract storage key from S3 URL
   */
  extractKeyFromUrl(url: string): string {
    // Extract key from URL like: https://bucket.s3.region.amazonaws.com/key
    const match = url.match(/https:\/\/[^/]+\/(.+)$/);
    if (!match) {
      throw new Error('Invalid S3 URL format');
    }
    return match[1];
  }
}

