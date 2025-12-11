/**
 * Meetings Service Chaos Test
 * Tests resilience under failure conditions
 */

const TestRunner = require('../utils/test-runner');
const chalk = require('chalk');
const { io } = require('socket.io-client');

class MeetingsChaosTest extends TestRunner {
  constructor(config) {
    super(config);
    this.wsUrl = config.wsUrl || 'http://localhost:3002';
    this.sockets = [];
  }

  /**
   * Test: Rapid join/leave cycles
   */
  async testRapidJoinLeave() {
    console.log(chalk.cyan('Chaos Test 1: Rapid Join/Leave Cycles...'));

    const meetingId = await this.createTestMeeting();
    if (!meetingId) {
      console.log(chalk.red('Failed to create test meeting'));
      return false;
    }

    const cycles = 50;
    let successCount = 0;

    for (let i = 0; i < cycles; i++) {
      const userId = `chaos-user-${i}`;
      
      // Join
      const joinResult = await this.makeRequest('POST', `/api/v1/meetings/${meetingId}/join`, {
        role: 'listener'
      });

      if (joinResult.success) {
        // Immediately leave
        const leaveResult = await this.makeRequest('POST', `/api/v1/meetings/${meetingId}/leave`);
        if (leaveResult.success) {
          successCount++;
        }
      }
    }

    const successRate = (successCount / cycles) * 100;
    console.log(chalk[successRate > 95 ? 'green' : 'yellow'](
      `  Result: ${successCount}/${cycles} cycles successful (${successRate.toFixed(1)}%)`
    ));

    return successRate > 95;
  }

  /**
   * Test: Concurrent joins with immediate disconnects
   */
  async testConcurrentJoinDisconnect() {
    console.log(chalk.cyan('Chaos Test 2: Concurrent Join/Disconnect...'));

    const meetingId = await this.createTestMeeting();
    if (!meetingId) {
      return false;
    }

    const concurrent = 20;
    const requests = [];

    for (let i = 0; i < concurrent; i++) {
      const userId = `chaos-concurrent-${i}`;
      requests.push(async () => {
        // Join
        const joinResult = await this.makeRequest('POST', `/api/v1/meetings/${meetingId}/join`, {
          role: 'listener'
        });

        if (joinResult.success) {
          // Wait a bit
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Leave
          await this.makeRequest('POST', `/api/v1/meetings/${meetingId}/leave`);
        }
      });
    }

    const results = await Promise.allSettled(requests.map(r => r()));
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const successRate = (successCount / concurrent) * 100;

    console.log(chalk[successRate > 90 ? 'green' : 'yellow'](
      `  Result: ${successCount}/${concurrent} successful (${successRate.toFixed(1)}%)`
    ));

    return successRate > 90;
  }

  /**
   * Test: WebSocket connection drops
   */
  async testWebSocketDrops() {
    console.log(chalk.cyan('Chaos Test 3: WebSocket Connection Drops...'));

    const meetingId = await this.createTestMeeting();
    if (!meetingId) {
      return false;
    }

    let successCount = 0;
    const testCount = 10;

    for (let i = 0; i < testCount; i++) {
      try {
        // Create socket connection
        const socket = io(this.wsUrl, {
          auth: {
            token: this.authToken || 'test-token'
          },
          transports: ['websocket']
        });

        await new Promise((resolve, reject) => {
          socket.on('connect', () => {
            // Join meeting room
            socket.emit('meeting:join', { meetingId });
            
            // Wait a bit
            setTimeout(() => {
              // Force disconnect
              socket.disconnect();
              resolve();
            }, 500);
          });

          socket.on('connect_error', reject);
          setTimeout(() => reject(new Error('Connection timeout')), 5000);
        });

        successCount++;
      } catch (error) {
        // Expected to fail sometimes
      }
    }

    const successRate = (successCount / testCount) * 100;
    console.log(chalk[successRate > 80 ? 'green' : 'yellow'](
      `  Result: ${successCount}/${testCount} successful (${successRate.toFixed(1)}%)`
    ));

    return successRate > 80;
  }

  /**
   * Test: Meeting state consistency under load
   */
  async testStateConsistency() {
    console.log(chalk.cyan('Chaos Test 4: State Consistency Under Load...'));

    const meetingId = await this.createTestMeeting();
    if (!meetingId) {
      return false;
    }

    // Join 50 participants
    const joinRequests = Array.from({ length: 50 }, (_, i) => 
      () => this.makeRequest('POST', `/api/v1/meetings/${meetingId}/join`, {
        role: 'listener'
      })
    );

    await this.runConcurrent(joinRequests, 10);

    // Get meeting state
    const stateResult = await this.makeRequest('GET', `/api/v1/meetings/${meetingId}`);
    
    if (!stateResult.success) {
      console.log(chalk.red('  Failed to get meeting state'));
      return false;
    }

    const participantCount = stateResult.response.data.data.participants?.length || 0;
    const expectedCount = 50;

    const isConsistent = Math.abs(participantCount - expectedCount) <= 5; // Allow 5 participant variance

    console.log(chalk[isConsistent ? 'green' : 'yellow'](
      `  Result: ${participantCount} participants (expected ~${expectedCount})`
    ));

    return isConsistent;
  }

  /**
   * Create test meeting
   */
  async createTestMeeting() {
    const result = await this.makeRequest('POST', '/api/v1/meetings', {
      title: 'Chaos Test Meeting',
      description: 'Testing resilience'
    });

    return result.success ? result.response.data.data.id : null;
  }

  /**
   * Run all chaos tests
   */
  async run() {
    console.log(chalk.bold.yellow('Starting Meetings Chaos Tests...\n'));

    this.start();

    const results = {
      rapidJoinLeave: await this.testRapidJoinLeave(),
      concurrentJoinDisconnect: await this.testConcurrentJoinDisconnect(),
      webSocketDrops: await this.testWebSocketDrops(),
      stateConsistency: await this.testStateConsistency()
    };

    this.end();

    console.log('\n' + chalk.bold.cyan('Chaos Test Results:'));
    console.log(chalk.bold.cyan('='.repeat(60)));
    
    Object.entries(results).forEach(([test, passed]) => {
      const name = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(passed ? chalk.green(`✅ ${name}`) : chalk.red(`❌ ${name}`));
    });

    const allPassed = Object.values(results).every(v => v);
    console.log(chalk.bold.cyan('='.repeat(60)));
    console.log(allPassed ? chalk.green('\n✅ All chaos tests passed!') : chalk.red('\n❌ Some chaos tests failed'));

    return { passed: allPassed, results };
  }
}

// Run if executed directly
if (require.main === module) {
  const test = new MeetingsChaosTest({
    baseUrl: process.env.MEETINGS_SERVICE_URL || 'http://localhost:3002',
    wsUrl: process.env.WS_URL || 'http://localhost:3002',
    authToken: process.env.AUTH_TOKEN
  });

  test.run().then(result => {
    process.exit(result.passed ? 0 : 1);
  }).catch(error => {
    console.error(chalk.red('Chaos test failed:'), error);
    process.exit(1);
  });
}

module.exports = MeetingsChaosTest;

