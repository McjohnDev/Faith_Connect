/**
 * Recording Integration Test
 * - Creates a meeting (host)
 * - Participant joins via WebSocket and API
 * - Host starts/stops recording via API
 * - Verifies WebSocket events and recording state API
 */

require('dotenv').config({ path: '.env' });
const { io } = require('socket.io-client');
const http = require('http');
const jwt = require('jsonwebtoken');

const API_URL = process.env.API_URL || 'http://localhost:3002';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

// Test users
const hostUserId = 'rec-host-' + Date.now();
const participantUserId = 'rec-participant-' + Date.now();

// Generate JWT tokens
const hostToken = jwt.sign({ userId: hostUserId, type: 'access' }, JWT_SECRET, { expiresIn: '1h' });
const participantToken = jwt.sign({ userId: participantUserId, type: 'access' }, JWT_SECRET, { expiresIn: '1h' });

let meetingId = null;
let eventsReceived = {
  'meeting:recording-started': false,
  'meeting:recording-stopped': false
};

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

console.log('🧪 Recording Integration Test\n');
console.log('─'.repeat(50));
console.log(`API URL: ${API_URL}`);
console.log(`Host User: ${hostUserId}`);
console.log(`Participant User: ${participantUserId}`);
console.log('─'.repeat(50) + '\n');

// Participant socket
const participantSocket = io(API_URL, {
  auth: { token: participantToken },
  transports: ['websocket', 'polling']
});

participantSocket.on('connect', async () => {
  console.log('✅ Participant connected to WebSocket\n');

  // Step 1: Create meeting
  console.log('📝 Step 1: Creating meeting...');
  const response = await makeRequest(
    'POST',
    '/api/v1/meetings',
    { title: 'Recording Test', description: 'Recording integration' },
    hostToken
  );

  if (response.status !== 201 || !response.data.success) {
    console.error('❌ Failed to create meeting:', response.data);
    process.exit(1);
  }

  meetingId = response.data.data.id;
  console.log(`✅ Meeting created: ${meetingId}\n`);

  // Join meeting room via WebSocket
  participantSocket.emit('meeting:join', { meetingId });
});

participantSocket.on('meeting:joined', async () => {
  console.log('✅ Participant joined meeting room\n');

  // Participant join via API (ensures participant record)
  console.log('👤 Joining meeting via API as participant...');
  const joinRes = await makeRequest(
    'POST',
    `/api/v1/meetings/${meetingId}/join`,
    { role: 'listener' },
    participantToken
  );
  if (joinRes.status !== 200) {
    console.error('❌ Failed to join meeting via API:', joinRes.data);
    finish(false);
    return;
  }
  console.log('✅ Joined via API\n');

  // Host starts recording
  console.log('⏺️  Starting recording via API as host...');
  const startRes = await makeRequest(
    'POST',
    `/api/v1/meetings/${meetingId}/recording/start`,
    null,
    hostToken
  );
  if (startRes.status !== 200 || !startRes.data.success) {
    console.error('❌ Failed to start recording:', startRes.data);
    finish(false);
    return;
  }
  console.log('✅ Recording start API responded\n');

  // Fetch recording state
  const stateAfterStart = await makeRequest(
    'GET',
    `/api/v1/meetings/${meetingId}/recording`,
    null,
    hostToken
  );
  console.log('📄 Recording state after start:', stateAfterStart.data);

  // Stop recording
  console.log('⏹️  Stopping recording via API as host...');
  const stopRes = await makeRequest(
    'POST',
    `/api/v1/meetings/${meetingId}/recording/stop`,
    null,
    hostToken
  );
  if (stopRes.status !== 200 || !stopRes.data.success) {
    console.error('❌ Failed to stop recording:', stopRes.data);
    finish(false);
    return;
  }
  console.log('✅ Recording stop API responded\n');

  const stateAfterStop = await makeRequest(
    'GET',
    `/api/v1/meetings/${meetingId}/recording`,
    null,
    hostToken
  );
  console.log('📄 Recording state after stop:', stateAfterStop.data);

  setTimeout(() => finish(), 500);
});

participantSocket.on('meeting:recording-started', () => {
  console.log('🎥 Event: recording started');
  eventsReceived['meeting:recording-started'] = true;
});

participantSocket.on('meeting:recording-stopped', () => {
  console.log('🛑 Event: recording stopped');
  eventsReceived['meeting:recording-stopped'] = true;
});

participantSocket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  finish(false);
});

function finish(successForced) {
  const allPassed = successForced === false ? false : Object.values(eventsReceived).every(Boolean);

  console.log('\n' + '='.repeat(50));
  console.log('📊 Recording Integration Results');
  console.log('='.repeat(50));
  Object.entries(eventsReceived).forEach(([event, received]) => {
    console.log(`${received ? '✅' : '❌'} ${event}: ${received ? 'Received' : 'Missing'}`);
  });
  console.log('='.repeat(50) + '\n');

  participantSocket.close();
  process.exit(allPassed ? 0 : 1);
}

// Timeout safeguard
setTimeout(() => {
  console.log('\n⏱️  Recording integration test timeout (30s)');
  finish(false);
}, 30000);

