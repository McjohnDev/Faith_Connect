/**
 * Twilio Service
 * SMS and WhatsApp OTP delivery via REST API
 */

import { logger } from '../utils/logger';

export type DeliveryMethod = 'sms' | 'whatsapp';

interface TwilioMessageResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  error_code?: string;
  error_message?: string;
}

export class TwilioService {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;
  private whatsappFromNumber: string;
  private messagingServiceSid: string | null;
  private baseUrl: string;
  private isConfigured: boolean = false;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.whatsappFromNumber = process.env.TWILIO_WHATSAPP_NUMBER || `whatsapp:${this.fromNumber}`;
    this.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || null;
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`;

    if (!this.accountSid || !this.authToken) {
      logger.warn('Twilio credentials not configured - SMS/WhatsApp features will be disabled');
      this.isConfigured = false;
      return;
    }

    this.isConfigured = true;
    
    if (this.messagingServiceSid) {
      logger.info(`Using Twilio Messaging Service: ${this.messagingServiceSid}`);
    } else {
      logger.info('Twilio configured (using phone number)');
    }
  }

  private ensureConfigured(): void {
    if (!this.isConfigured) {
      throw new Error('Twilio is not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    }
  }

  /**
   * Create Basic Auth header for Twilio API
   */
  private getAuthHeader(): string {
    const credentials = `${this.accountSid}:${this.authToken}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  /**
   * Send message via Twilio REST API
   */
  private async sendMessage(
    to: string,
    message: string,
    useWhatsApp: boolean = false
  ): Promise<TwilioMessageResponse> {
    this.ensureConfigured();

    const url = `${this.baseUrl}/Messages.json`;
    
    // Format phone number for WhatsApp if needed
    const formattedTo = useWhatsApp 
      ? (to.startsWith('whatsapp:') ? to : `whatsapp:${to}`)
      : to;

    // Build form data
    const formData = new URLSearchParams();
    formData.append('To', formattedTo);
    formData.append('Body', message);

    // Use Messaging Service SID if available (better deliverability)
    if (this.messagingServiceSid) {
      formData.append('MessagingServiceSid', this.messagingServiceSid);
    } else {
      // Use phone number as sender
      const from = useWhatsApp ? this.whatsappFromNumber : this.fromNumber;
      formData.append('From', from);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Twilio API error (${response.status}):`, errorText);
        
        // Try to parse error response
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `Twilio API error: ${response.status}`);
        } catch {
          throw new Error(`Twilio API error: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json() as TwilioMessageResponse;
      
      if (data.error_code) {
        logger.error(`Twilio error: ${data.error_code} - ${data.error_message}`);
        throw new Error(data.error_message || 'Twilio API error');
      }

      return data;
    } catch (error: any) {
      logger.error('Twilio API request failed:', error);
      throw error;
    }
  }

  /**
   * Send OTP via SMS
   * Uses Messaging Service SID if available, otherwise uses phone number
   */
  async sendSms(to: string, message: string): Promise<void> {
    try {
      const result = await this.sendMessage(to, message, false);
      logger.info(`SMS sent to ${to} (SID: ${result.sid})${this.messagingServiceSid ? ' (via Messaging Service)' : ''}`);
    } catch (error: any) {
      logger.error('Twilio SMS error:', error);
      throw new Error('SMS_SEND_FAILED');
    }
  }

  /**
   * Send OTP via WhatsApp
   * Uses Messaging Service SID if available, otherwise uses WhatsApp number
   */
  async sendWhatsApp(to: string, message: string): Promise<void> {
    try {
      const result = await this.sendMessage(to, message, true);
      logger.info(`WhatsApp message sent to ${to} (SID: ${result.sid})${this.messagingServiceSid ? ' (via Messaging Service)' : ''}`);
    } catch (error: any) {
      logger.error('Twilio WhatsApp error:', error);
      throw new Error('WHATSAPP_SEND_FAILED');
    }
  }

  /**
   * Send OTP via specified method (SMS or WhatsApp)
   */
  async sendOtp(
    to: string,
    message: string,
    method: DeliveryMethod = 'sms'
  ): Promise<{ method: DeliveryMethod; delivered: boolean }> {
    try {
      if (method === 'whatsapp') {
        await this.sendWhatsApp(to, message);
        return { method: 'whatsapp', delivered: true };
      } else {
        await this.sendSms(to, message);
        return { method: 'sms', delivered: true };
      }
    } catch (error: any) {
      logger.error(`Failed to send ${method} to ${to}:`, error);
      
      // Fallback: if WhatsApp fails, try SMS
      if (method === 'whatsapp') {
        logger.info(`Falling back to SMS for ${to}`);
        try {
          await this.sendSms(to, message);
          return { method: 'sms', delivered: true };
        } catch (fallbackError) {
          throw new Error('OTP_SEND_FAILED');
        }
      }
      
      throw new Error('OTP_SEND_FAILED');
    }
  }
}
