/**
 * WebSocket Integration Test
 * Tests WebSocket events triggered by actual API calls
 */

require('dotenv').config({ path: '.env' });
const { io } = require('socket.io-client');
const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3002';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

const jwt = require('jsonwebtoken');

// Test users
const hostUserId = 'test-host-' + Date.now();
const participantUserId = 'test-participant-' + Date.now();

// Generate JWT tokens
const hostToken = jwt.sign(
  { userId: hostUserId, type: 'access' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const participantToken = jwt.sign(
  { userId: participantUserId, type: 'access' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('🧪 WebSocket Integration Test\n');
console.log('─'.repeat(50));
console.log(`API URL: ${API_URL}`);
console.log(`Host User: ${hostUserId}`);
console.log(`Participant User: ${participantUserId}`);
console.log('─'.repeat(50) + '\n');

let meetingId = null;
let eventsReceived = {
  'meeting:participant-joined': false,
  'meeting:hand-raised': false,
  'meeting:music-started': false,
  'meeting:music-stopped': false
};

async function fetchMusicState(label) {
  const response = await makeRequest(
    'GET',
    `/api/v1/meetings/${meetingId}/music`,
    null,
    hostToken
  );
  console.log(`${label} music state status:`, response.status, response.data);
  return response;
}

async function startMusic() {
  console.log('\n🎵 Step 4: Starting background music...');
  try {
    const response = await makeRequest(
      'POST',
      `/api/v1/meetings/${meetingId}/music/start`,
      {
        source: 'url',
        trackUrl: 'https://example.com/music.mp3',
        volume: 50,
        isLooping: true
      },
      hostToken
    );

    if (response.status === 200) {
      console.log('✅ Music start request sent\n');
    } else {
      console.error('❌ Failed to start music:', response.data);
    }
  } catch (error) {
    console.error('❌ Error starting music:', error.message);
  }
}

async function stopMusic() {
  console.log('\n🔇 Step 5: Stopping background music...');
  try {
    const response = await makeRequest(
      'POST',
      `/api/v1/meetings/${meetingId}/music/stop`,
      null,
      hostToken
    );

    if (response.status === 200) {
      console.log('✅ Music stop request sent\n');
    } else {
      console.error('❌ Failed to stop music:', response.data);
    }
  } catch (error) {
    console.error('❌ Error stopping music:', error.message);
  }
}

async function raiseHand() {
  console.log('\n✋ Step 6: Raising hand...');
  try {
    const response = await makeRequest(
      'POST',
      `/api/v1/meetings/${meetingId}/hand/raise`,
      null,
      participantToken
    );
    if (response.status === 200) {
      console.log('✅ Hand raise request sent\n');
    } else {
      console.error('❌ Failed to raise hand:', response.data);
    }
  } catch (error) {
    console.error('❌ Error raising hand:', error.message);
  }
}

// Helper to make HTTP requests
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

// Create WebSocket connection for participant
const participantSocket = io(API_URL, {
  auth: { token: participantToken },
  transports: ['websocket', 'polling']
});

// Set up event listeners
participantSocket.on('connect', async () => {
  console.log('✅ Participant connected to WebSocket\n');

  // Step 1: Create meeting (as host)
  console.log('📝 Step 1: Creating meeting...');
  try {
    const response = await makeRequest('POST', '/api/v1/meetings', {
      title: 'Test Meeting',
      description: 'WebSocket Integration Test',
      backgroundMusicEnabled: true
    }, hostToken);

    if (response.status === 201 && response.data.success) {
      meetingId = response.data.data.id;
      console.log(`✅ Meeting created: ${meetingId}\n`);

      // Step 2: Join meeting room via WebSocket
      console.log('📥 Step 2: Joining meeting room via WebSocket...');
      participantSocket.emit('meeting:join', { meetingId });
    } else {
      console.error('❌ Failed to create meeting:', response.data);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error creating meeting:', error.message);
    process.exit(1);
  }
});

participantSocket.on('meeting:joined', async () => {
  console.log('✅ Joined meeting room\n');

  // Step 3: Join meeting via API (should trigger participant-joined event)
  console.log('👤 Step 3: Joining meeting via API...');
  try {
    const response = await makeRequest(
      'POST',
      `/api/v1/meetings/${meetingId}/join`,
      { role: 'listener' },
      participantToken
    );

    if (response.status === 200) {
      console.log('✅ Joined meeting via API\n');
      // Kick off music start flow
      await startMusic();
    } else {
      console.error('❌ Failed to join meeting:', response.data);
    }
  } catch (error) {
    console.error('❌ Error joining meeting:', error.message);
  }
});

// Listen for events
participantSocket.on('meeting:participant-joined', (data) => {
  console.log('👤 Event: Participant joined -', data.userId);
  eventsReceived['meeting:participant-joined'] = true;
});

participantSocket.on('meeting:hand-raised', async (data) => {
  console.log('✋ Event: Hand raised -', data.userId);
  eventsReceived['meeting:hand-raised'] = true;
});

participantSocket.on('meeting:music-started', async (data) => {
  console.log('🎵 Event: Music started -', data.musicState.trackUrl);
  eventsReceived['meeting:music-started'] = true;

  await fetchMusicState('After start');

  await stopMusic();
});

participantSocket.on('meeting:music-stopped', (data) => {
  console.log('🔇 Event: Music stopped -', data.userId);
  eventsReceived['meeting:music-stopped'] = true;

  fetchMusicState('After stop').then(() => {
  raiseHand().then(() => {
    setTimeout(() => {
      finishTest();
    }, 1000);
  });
  });
});

participantSocket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

function finishTest() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 Integration Test Results');
  console.log('='.repeat(50));

  const allPassed = Object.values(eventsReceived).every(v => v === true);

  Object.entries(eventsReceived).forEach(([event, received]) => {
    console.log(`${received ? '✅' : '❌'} ${event}: ${received ? 'Received' : 'Not received'}`);
  });

  console.log('='.repeat(50));
  console.log(`\n${allPassed ? '🎉 All events received!' : '⚠️  Some events missing'}\n`);

  participantSocket.close();
  process.exit(allPassed ? 0 : 1);
}

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⏱️  Test timeout (30s)');
  finishTest();
}, 30000);

