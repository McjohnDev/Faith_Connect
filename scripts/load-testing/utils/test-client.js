/**
 * Test Client Utility
 * Helper for making authenticated requests
 */

const axios = require('axios');

class TestClient {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async createMeeting(meetingData) {
    const response = await this.client.post('/api/v1/meetings', meetingData);
    return response.data;
  }

  async joinMeeting(meetingId, role = 'listener') {
    const response = await this.client.post(`/api/v1/meetings/${meetingId}/join`, { role });
    return response.data;
  }

  async leaveMeeting(meetingId) {
    const response = await this.client.post(`/api/v1/meetings/${meetingId}/leave`);
    return response.data;
  }

  async getMeeting(meetingId) {
    const response = await this.client.get(`/api/v1/meetings/${meetingId}`);
    return response.data;
  }

  async listMeetings(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await this.client.get(`/api/v1/meetings?${params}`);
    return response.data;
  }

  async reportNetworkQuality(meetingId, quality) {
    const response = await this.client.post(
      `/api/v1/meetings/${meetingId}/network/quality`,
      quality
    );
    return response.data;
  }

  async reconnect(meetingId) {
    const response = await this.client.post(`/api/v1/meetings/${meetingId}/reconnect`);
    return response.data;
  }

  async raiseHand(meetingId) {
    const response = await this.client.post(`/api/v1/meetings/${meetingId}/hand/raise`);
    return response.data;
  }

  async lowerHand(meetingId) {
    const response = await this.client.post(`/api/v1/meetings/${meetingId}/hand/lower`);
    return response.data;
  }

  async health() {
    const response = await this.client.get('/health');
    return response.data;
  }

  async metrics() {
    const response = await this.client.get('/metrics');
    return response.data;
  }
}

module.exports = { TestClient };

