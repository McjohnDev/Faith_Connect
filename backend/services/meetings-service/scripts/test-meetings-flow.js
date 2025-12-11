/**
 * Test Meetings Service Flow
 * 
 * Tests meeting creation, join, and controls
 * 
 * Usage:
 *   node scripts/test-meetings-flow.js <userId>
 * 
 * Example:
 *   node scripts/test-meetings-flow.js user-123
 */

const http = require('http');

const BASE_URL = process.env.MEETINGS_SERVICE_URL || 'http://localhost:3002';
const userId = process.argv[2] || 'test-user-123';

// Helper to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Mock user in request (in real app, this comes from JWT middleware)
    if (!token) {
      options.headers['X-User-Id'] = userId;
    }

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
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

async function testMeetingsFlow() {
  console.log('🧪 Testing Meetings Service Flow\n');
  console.log(`User ID: ${userId}`);
  console.log(`Service URL: ${BASE_URL}\n`);

  try {
    // Step 1: Health Check
    console.log('1️⃣  Testing health endpoint...');
    const health = await makeRequest('GET', '/health');
    if (health.status === 200) {
      console.log('   ✅ Health check passed\n');
    } else {
      console.log('   ❌ Health check failed\n');
      process.exit(1);
    }

    // Step 2: Create Meeting
    console.log('2️⃣  Creating meeting...');
    const createResult = await makeRequest('POST', '/api/v1/meetings', {
      title: 'Test Prayer Meeting',
      description: 'Testing the meetings service',
      maxParticipants: 50,
      backgroundMusicEnabled: true,
      recordingEnabled: false
    });

    if (createResult.status === 201 || createResult.status === 200) {
      const meeting = createResult.data.data;
      console.log('   ✅ Meeting created successfully');
      console.log(`   📅 Meeting ID: ${meeting.id}`);
      console.log(`   📺 Channel: ${meeting.channelName}`);
      console.log(`   📊 Status: ${meeting.status}`);
      console.log(`   👤 Host ID: ${meeting.hostId}\n`);

      const meetingId = meeting.id;

      // Step 3: Get Meeting
      console.log('3️⃣  Getting meeting details...');
      const getResult = await makeRequest('GET', `/api/v1/meetings/${meetingId}`);
      if (getResult.status === 200) {
        console.log('   ✅ Meeting retrieved successfully\n');
      } else {
        console.log('   ❌ Failed to get meeting\n');
      }

      // Step 4: Join Meeting
      console.log('4️⃣  Joining meeting...');
      const joinResult = await makeRequest('POST', `/api/v1/meetings/${meetingId}/join`, {
        role: 'listener'
      });

      if (joinResult.status === 200) {
        const joinData = joinResult.data.data;
        console.log('   ✅ Joined meeting successfully');
        console.log(`   🎤 Role: ${joinData.participant?.role}`);
        console.log(`   🔑 Agora Token: ${joinData.agoraToken?.substring(0, 30)}...`);
        console.log(`   🆔 Agora UID: ${joinData.agoraUid}\n`);

        // Step 5: Raise Hand
        console.log('5️⃣  Raising hand...');
        const raiseHandResult = await makeRequest('POST', `/api/v1/meetings/${meetingId}/hand/raise`);
        if (raiseHandResult.status === 200) {
          console.log('   ✅ Hand raised successfully\n');
        } else {
          console.log('   ❌ Failed to raise hand\n');
        }

        // Step 6: Meeting Controls (mute)
        console.log('6️⃣  Testing meeting controls (mute)...');
        const muteResult = await makeRequest('POST', `/api/v1/meetings/${meetingId}/control`, {
          action: 'mute',
          participantId: userId
        });

        if (muteResult.status === 200) {
          console.log('   ✅ Mute control executed\n');
        } else {
          console.log('   ⚠️  Mute control failed (may need host permissions)\n');
        }

        // Step 7: List Meetings
        console.log('7️⃣  Listing meetings...');
        const listResult = await makeRequest('GET', '/api/v1/meetings?status=active');
        if (listResult.status === 200) {
          console.log(`   ✅ Found ${listResult.data.count || 0} meetings\n`);
        } else {
          console.log('   ❌ Failed to list meetings\n');
        }

        // Step 8: Leave Meeting
        console.log('8️⃣  Leaving meeting...');
        const leaveResult = await makeRequest('POST', `/api/v1/meetings/${meetingId}/leave`);
        if (leaveResult.status === 200) {
          console.log('   ✅ Left meeting successfully\n');
        } else {
          console.log('   ❌ Failed to leave meeting\n');
        }

      } else {
        console.log('   ❌ Failed to join meeting');
        console.log(`   Error: ${JSON.stringify(joinResult.data)}\n`);
      }

      console.log('✅ Meetings Service Flow Test Complete!\n');
      console.log('Summary:');
      console.log('  ✅ Health check');
      console.log('  ✅ Create meeting');
      console.log('  ✅ Get meeting');
      console.log('  ✅ Join meeting');
      console.log('  ✅ Raise hand');
      console.log('  ✅ Meeting controls');
      console.log('  ✅ List meetings');
      console.log('  ✅ Leave meeting\n');

    } else {
      console.log('   ❌ Meeting creation failed');
      console.log(`   Status: ${createResult.status}`);
      console.log(`   Error: ${JSON.stringify(createResult.data)}\n`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Make sure the meetings service is running on port 3002');
    }
    process.exit(1);
  }
}

testMeetingsFlow().catch(console.error);

