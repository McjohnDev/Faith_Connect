/**
 * Agora Cloud Recording Service
 * Handles Agora Cloud Recording API integration
 */

import { logger } from '../utils/logger';

export interface AgoraRecordingConfig {
  appId: string;
  appCertificate: string;
  customerId?: string;
  customerSecret?: string;
  resourceId?: string; // Pre-allocated resource ID
}

export interface StartRecordingParams {
  channelName: string;
  uid: string; // Agora UID (usually 0 for recording bot)
  token: string; // Agora token
  recordingConfig?: {
    maxIdleTime?: number; // Max idle time in seconds (default 30)
    streamTypes?: number; // 0: audio only, 1: video only, 2: audio+video
    audioProfile?: number; // Audio profile
    videoStreamType?: number; // Video stream type
    subscribeVideoUids?: string[]; // UIDs to record
    subscribeAudioUids?: string[]; // UIDs to record
  };
  storageConfig?: {
    vendor: number; // 0: Agora Cloud, 1: AWS S3, 2: Alibaba Cloud, 3: Tencent Cloud
    region?: number; // Region ID
    bucket?: string; // S3 bucket name
    accessKey?: string; // AWS access key
    secretKey?: string; // AWS secret key
    fileNamePrefix?: string[]; // File name prefix
  };
}

export interface RecordingResponse {
  resourceId: string;
  sid: string; // Recording session ID
  serverResponse?: {
    fileList?: Array<{
      fileName: string;
      trackType: string;
      uid: string;
      mixedAllUser: boolean;
      isPlayable: boolean;
      sliceStartTime: number;
    }>;
    uploadingStatus?: string;
  };
}

export class AgoraRecordingService {
  private appId: string;
  private appCertificate: string;
  private customerId?: string;
  private customerSecret?: string;
  private baseUrl: string;

  constructor(config: AgoraRecordingConfig) {
    this.appId = config.appId;
    this.appCertificate = config.appCertificate;
    this.customerId = config.customerId;
    this.customerSecret = config.customerSecret;
    
    // Agora Cloud Recording API base URL
    this.baseUrl = 'https://api.agora.io/v1';
  }

  /**
   * Acquire a recording resource
   */
  async acquireResource(channelName: string, uid: string): Promise<string> {
    try {
      const url = `${this.baseUrl}/apps/${this.appId}/cloud_recording/acquire`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify({
          cname: channelName,
          uid: uid,
          clientRequest: {
            resourceExpiredHour: 24 // Resource expires in 24 hours
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Agora acquire failed: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      logger.info(`Agora resource acquired: ${data.resourceId}`);
      return data.resourceId;
    } catch (error: any) {
      logger.error('Agora acquire resource error:', error);
      throw new Error(`AGORA_ACQUIRE_FAILED: ${error.message}`);
    }
  }

  /**
   * Start recording
   */
  async startRecording(params: StartRecordingParams, resourceId?: string): Promise<RecordingResponse> {
    try {
      // Acquire resource if not provided
      if (!resourceId) {
        resourceId = await this.acquireResource(params.channelName, params.uid);
      }

      const url = `${this.baseUrl}/apps/${this.appId}/cloud_recording/resourceid/${resourceId}/mode/mix/start`;
      
      const requestBody: any = {
        cname: params.channelName,
        uid: params.uid,
        clientRequest: {
          token: params.token,
          recordingConfig: {
            maxIdleTime: params.recordingConfig?.maxIdleTime || 30,
            streamTypes: params.recordingConfig?.streamTypes || 0, // Audio only
            audioProfile: params.recordingConfig?.audioProfile || 0,
            ...params.recordingConfig
          }
        }
      };

      // Add storage config if provided
      if (params.storageConfig) {
        requestBody.clientRequest.storageConfig = params.storageConfig;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Agora start recording failed: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      logger.info(`Agora recording started: sid=${data.sid}, resourceId=${resourceId}`);
      
      return {
        resourceId,
        sid: data.sid,
        serverResponse: data.serverResponse
      };
    } catch (error: any) {
      logger.error('Agora start recording error:', error);
      throw new Error(`AGORA_START_RECORDING_FAILED: ${error.message}`);
    }
  }

  /**
   * Stop recording
   */
  async stopRecording(resourceId: string, sid: string, channelName: string, uid: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/apps/${this.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify({
          cname: channelName,
          uid: uid,
          clientRequest: {}
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Agora stop recording failed: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      logger.info(`Agora recording stopped: sid=${sid}`);
      return data;
    } catch (error: any) {
      logger.error('Agora stop recording error:', error);
      throw new Error(`AGORA_STOP_RECORDING_FAILED: ${error.message}`);
    }
  }

  /**
   * Query recording status
   */
  async queryRecording(resourceId: string, sid: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/apps/${this.appId}/cloud_recording/resourceid/${resourceId}/sid/${sid}/mode/mix/query`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader()
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Agora query recording failed: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      logger.error('Agora query recording error:', error);
      throw new Error(`AGORA_QUERY_RECORDING_FAILED: ${error.message}`);
    }
  }

  /**
   * Get authentication header
   */
  private getAuthHeader(): string {
    if (this.customerId && this.customerSecret) {
      // Use customer credentials
      const credentials = Buffer.from(`${this.customerId}:${this.customerSecret}`).toString('base64');
      return `Basic ${credentials}`;
    } else {
      // Use app credentials (legacy)
      const credentials = Buffer.from(`${this.appId}:${this.appCertificate}`).toString('base64');
      return `Basic ${credentials}`;
    }
  }
}

