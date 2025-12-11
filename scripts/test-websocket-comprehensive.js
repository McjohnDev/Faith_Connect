/**
 * Comprehensive WebSocket Test
 * Tests all WebSocket events by triggering API calls
 */

require('dotenv').config({ path: './backend/services/meetings-service/.env' });
const { io } = require('socket.io-client');
const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3002';
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

const jwt = require('jsonwebtoken');

const userId = 'ws-test-user-' + Date.now();
const token = jwt.sign({ userId, type: 'access' }, JWT_SECRET, { expiresIn: '1h' });

let meetingId = null;
const eventsReceived = new Set();

console.log('🧪 Comprehensive WebSocket Test\n');
console.log('─'.repeat(60));
console.log(`User ID: ${userId}`);
console.log(`API URL: ${API_URL}`);
console.log('─'.repeat(60) + '\n');

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: body ? JSON.parse(body) : {} });
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

const socket = io(API_URL, {
  auth: { token },
  transports: ['websocket', 'polling']
});

socket.on('connect', async () => {
  console.log('✅ Connected to WebSocket server\n');

  // Create meeting
  console.log('📝 Creating meeting...');
  const createRes = await makeRequest('POST', '/api/v1/meetings', {
    title: 'WebSocket Test Meeting',
    description: 'Comprehensive WebSocket event testing'
  });
  
  if (createRes.status === 200 && createRes.data.success) {
    meetingId = createRes.data.data.id;
    console.log(`✅ Meeting created: ${meetingId}\n`);
    
    // Join meeting room
    console.log('📥 Joining meeting room...');
    socket.emit('meeting:join', { meetingId });
  } else {
    console.error('❌ Failed to create meeting');
    process.exit(1);
  }
});

socket.on('meeting:joined', async () => {
  console.log('✅ Joined meeting room\n');
  
  // Join via API (triggers participant-joined event)
  console.log('👤 Joining meeting via API...');
  await makeRequest('POST', `/api/v1/meetings/${meetingId}/join`, { role: 'speaker' });
  
  // Wait for participant-joined event, then continue
  setTimeout(async () => {
    await testEvents();
  }, 500);
});

async function testEvents() {
  console.log('\n📡 Testing WebSocket Events...\n');
  
  // Test hand raise
  console.log('✋ Testing hand raise...');
  await makeRequest('POST', `/api/v1/meetings/${meetingId}/hand/raise`);
  await sleep(300);
  
  // Test music
  console.log('🎵 Testing music start...');
  await makeRequest('POST', `/api/v1/meetings/${meetingId}/music/start`, {
    source: 'url',
    trackUrl: 'https://example.com/test.mp3',
    volume: 60,
    isLooping: true
  });
  await sleep(300);
  
  console.log('🔊 Testing music volume update...');
  await makeRequest('PUT', `/api/v1/meetings/${meetingId}/music/volume`, { volume: 80 });
  await sleep(300);
  
  console.log('🔇 Testing music stop...');
  await makeRequest('POST', `/api/v1/meetings/${meetingId}/music/stop`);
  await sleep(300);
  
  // Test recording
  console.log('📹 Testing recording start...');
  await makeRequest('POST', `/api/v1/meetings/${meetingId}/recording/start`);
  await sleep(300);
  
  console.log('⏹️  Testing recording stop...');
  await makeRequest('POST', `/api/v1/meetings/${meetingId}/recording/stop`);
  await sleep(300);
  
  // Test screenshare
  console.log('📺 Testing screenshare start...');
  await makeRequest('POST', `/api/v1/meetings/${meetingId}/screenshare/start`);
  await sleep(300);
  
  console.log('📺 Testing screenshare stop...');
  await makeRequest('POST', `/api/v1/meetings/${meetingId}/screenshare/stop`);
  await sleep(300);
  
  // Test resource share
  console.log('📄 Testing resource share...');
  await makeRequest('POST', `/api/v1/meetings/${meetingId}/resources/share`, {
    type: 'pdf',
    url: 'https://example.com/test.pdf',
    name: 'Test Resource',
    description: 'WebSocket test resource'
  });
  await sleep(300);
  
  // Test meeting lock
  console.log('🔒 Testing meeting lock...');
  await makeRequest('POST', `/api/v1/meetings/${meetingId}/control`, { action: 'lock' });
  await sleep(300);
  
  console.log('🔓 Testing meeting unlock...');
  await makeRequest('POST', `/api/v1/meetings/${meetingId}/control`, { action: 'unlock' });
  await sleep(500);
  
  // Finish
  finishTest();
}

// Event listeners
socket.on('meeting:participant-joined', (data) => {
  console.log(`  ✅ Received: meeting:participant-joined (${data.userId})`);
  eventsReceived.add('meeting:participant-joined');
});

socket.on('meeting:hand-raised', (data) => {
  console.log(`  ✅ Received: meeting:hand-raised (${data.userId})`);
  eventsReceived.add('meeting:hand-raised');
});

socket.on('meeting:music-started', (data) => {
  console.log(`  ✅ Received: meeting:music-started (${data.musicState.trackUrl})`);
  eventsReceived.add('meeting:music-started');
});

socket.on('meeting:music-volume-updated', (data) => {
  console.log(`  ✅ Received: meeting:music-volume-updated (${data.volume}%)`);
  eventsReceived.add('meeting:music-volume-updated');
});

socket.on('meeting:music-stopped', (data) => {
  console.log(`  ✅ Received: meeting:music-stopped (${data.userId})`);
  eventsReceived.add('meeting:music-stopped');
});

socket.on('meeting:recording-started', (data) => {
  console.log(`  ✅ Received: meeting:recording-started (${data.userId})`);
  eventsReceived.add('meeting:recording-started');
});

socket.on('meeting:recording-stopped', (data) => {
  console.log(`  ✅ Received: meeting:recording-stopped (${data.userId})`);
  eventsReceived.add('meeting:recording-stopped');
});

socket.on('meeting:screenshare-started', (data) => {
  console.log(`  ✅ Received: meeting:screenshare-started (${data.userId})`);
  eventsReceived.add('meeting:screenshare-started');
});

socket.on('meeting:screenshare-stopped', (data) => {
  console.log(`  ✅ Received: meeting:screenshare-stopped (${data.userId})`);
  eventsReceived.add('meeting:screenshare-stopped');
});

socket.on('meeting:resource-shared', (data) => {
  console.log(`  ✅ Received: meeting:resource-shared (${data.resource.name})`);
  eventsReceived.add('meeting:resource-shared');
});

socket.on('meeting:locked', (data) => {
  console.log(`  ✅ Received: meeting:locked (${data.userId})`);
  eventsReceived.add('meeting:locked');
});

socket.on('meeting:unlocked', (data) => {
  console.log(`  ✅ Received: meeting:unlocked (${data.userId})`);
  eventsReceived.add('meeting:unlocked');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function finishTest() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 WebSocket Test Results');
  console.log('='.repeat(60));
  
  const expectedEvents = [
    'meeting:participant-joined',
    'meeting:hand-raised',
    'meeting:music-started',
    'meeting:music-volume-updated',
    'meeting:music-stopped',
    'meeting:recording-started',
    'meeting:recording-stopped',
    'meeting:screenshare-started',
    'meeting:screenshare-stopped',
    'meeting:resource-shared',
    'meeting:locked',
    'meeting:unlocked'
  ];
  
  let passed = 0;
  let failed = 0;
  
  expectedEvents.forEach(event => {
    if (eventsReceived.has(event)) {
      console.log(`✅ ${event}`);
      passed++;
    } else {
      console.log(`❌ ${event} - NOT RECEIVED`);
      failed++;
    }
  });
  
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${expectedEvents.length}`);
  console.log('='.repeat(60) + '\n');
  
  if (failed === 0) {
    console.log('🎉 All WebSocket events working correctly!\n');
  } else {
    console.log('⚠️  Some events were not received. Check the logs above.\n');
  }
  
  socket.close();
  process.exit(failed === 0 ? 0 : 1);
}

// Timeout
setTimeout(() => {
  console.log('\n⏱️  Test timeout (30s)');
  finishTest();
}, 30000);

