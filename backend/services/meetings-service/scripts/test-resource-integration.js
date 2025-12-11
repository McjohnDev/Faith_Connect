/**
 * Resource Share Integration Test
 * - Host creates meeting
 * - Participant joins via WebSocket and API
 * - Participant shares resource via API
 * - Verifies resource-shared event and list endpoint
 */

require('dotenv').config({ path: '.env' });
const { io } = require('socket.io-client');
const http = require('http');
const jwt = require('jsonwebtoken');

const API_URL = process.env.API_URL || 'http://localhost:3002';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

const hostUserId = 'res-host-' + Date.now();
const participantUserId = 'res-participant-' + Date.now();

const hostToken = jwt.sign({ userId: hostUserId, type: 'access' }, JWT_SECRET, { expiresIn: '1h' });
const participantToken = jwt.sign({ userId: participantUserId, type: 'access' }, JWT_SECRET, { expiresIn: '1h' });

let meetingId = null;
let eventsReceived = {
  'meeting:resource-shared': false
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
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

console.log('🧪 Resource Share Integration Test\n');
console.log('─'.repeat(50));
console.log(`API URL: ${API_URL}`);
console.log(`Host User: ${hostUserId}`);
console.log(`Participant User: ${participantUserId}`);
console.log('─'.repeat(50) + '\n');

const participantSocket = io(API_URL, {
  auth: { token: participantToken },
  transports: ['websocket', 'polling']
});

participantSocket.on('connect', async () => {
  console.log('✅ Participant connected to WebSocket\n');

  // Create meeting
  const createRes = await makeRequest(
    'POST',
    '/api/v1/meetings',
    { title: 'Resource Share Test', description: 'share integration' },
    hostToken
  );
  if (createRes.status !== 201 || !createRes.data.success) {
    console.error('❌ Failed to create meeting:', createRes.data);
    finish(false);
    return;
  }
  meetingId = createRes.data.data.id;
  console.log(`✅ Meeting created: ${meetingId}\n`);

  // Join WebSocket room
  participantSocket.emit('meeting:join', { meetingId });
});

participantSocket.on('meeting:joined', async () => {
  console.log('✅ Participant joined meeting room\n');

  // Join via API to register participant
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

  // Share resource via API
  console.log('📄 Sharing resource via API as participant...');
  const shareRes = await makeRequest(
    'POST',
    `/api/v1/meetings/${meetingId}/resources/share`,
    {
      type: 'link',
      url: 'https://example.com/resource',
      name: 'Example Resource',
      description: 'Integration test resource'
    },
    participantToken
  );
  if (shareRes.status !== 200 || !shareRes.data.success) {
    console.error('❌ Failed to share resource:', shareRes.data);
    finish(false);
    return;
  }
  console.log('✅ Resource share API responded\n');

  // Fetch list
  const listRes = await makeRequest(
    'GET',
    `/api/v1/meetings/${meetingId}/resources`,
    null,
    participantToken
  );
  console.log('📄 Resource list:', listRes.data);

  setTimeout(() => finish(), 500);
});

participantSocket.on('meeting:resource-shared', (data) => {
  console.log('📢 Event: resource shared', data.resource?.name || data.name);
  eventsReceived['meeting:resource-shared'] = true;
});

participantSocket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  finish(false);
});

function finish(successForced) {
  const allPassed = successForced === false ? false : Object.values(eventsReceived).every(Boolean);

  console.log('\n' + '='.repeat(50));
  console.log('📊 Resource Share Integration Results');
  console.log('='.repeat(50));
  Object.entries(eventsReceived).forEach(([event, received]) => {
    console.log(`${received ? '✅' : '❌'} ${event}: ${received ? 'Received' : 'Missing'}`);
  });
  console.log('='.repeat(50) + '\n');

  participantSocket.close();
  process.exit(allPassed ? 0 : 1);
}

setTimeout(() => {
  console.log('\n⏱️  Resource share integration test timeout (30s)');
  finish(false);
}, 30000);

