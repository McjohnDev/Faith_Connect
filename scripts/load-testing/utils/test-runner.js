/**
 * Test Runner Utility
 * Base class for load and performance tests
 */

const axios = require('axios');
const chalk = require('chalk');
const cliProgress = require('cli-progress');

class TestRunner {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3002';
    this.authToken = config.authToken || null;
    this.concurrent = config.concurrent || 10;
    this.duration = config.duration || 60000; // 1 minute default
    this.results = {
      total: 0,
      success: 0,
      failed: 0,
      errors: [],
      responseTimes: [],
      startTime: null,
      endTime: null
    };
  }

  /**
   * Create HTTP client with auth
   */
  createClient() {
    const client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: this.authToken ? {
        'Authorization': `Bearer ${this.authToken}`,
        'X-User-Id': 'test-user'
      } : {
        'X-User-Id': 'test-user'
      }
    });

    return client;
  }

  /**
   * Make request and track metrics
   */
  async makeRequest(method, url, data = null) {
    const startTime = Date.now();
    const client = this.createClient();

    try {
      const response = await client.request({
        method,
        url,
        data
      });

      const responseTime = Date.now() - startTime;
      this.results.total++;
      this.results.success++;
      this.results.responseTimes.push(responseTime);

      return { success: true, response, responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.results.total++;
      this.results.failed++;
      this.results.errors.push({
        url,
        error: error.message,
        responseTime
      });

      return { success: false, error, responseTime };
    }
  }

  /**
   * Run concurrent requests
   */
  async runConcurrent(requests, concurrency = this.concurrent) {
    const results = [];
    const batches = [];

    for (let i = 0; i < requests.length; i += concurrency) {
      batches.push(requests.slice(i, i + concurrency));
    }

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(req => req())
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Calculate statistics
   */
  calculateStats() {
    const times = this.results.responseTimes;
    if (times.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0
      };
    }

    const sorted = [...times].sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: Math.round(sum / times.length),
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  /**
   * Print results
   */
  printResults() {
    const duration = this.results.endTime - this.results.startTime;
    const stats = this.calculateStats();
    const successRate = (this.results.success / this.results.total * 100).toFixed(2);

    console.log('\n' + chalk.bold.cyan('='.repeat(60)));
    console.log(chalk.bold.cyan('Test Results'));
    console.log(chalk.bold.cyan('='.repeat(60)));
    console.log(chalk.green(`Total Requests: ${this.results.total}`));
    console.log(chalk.green(`Successful: ${this.results.success}`));
    console.log(chalk.red(`Failed: ${this.results.failed}`));
    console.log(chalk.yellow(`Success Rate: ${successRate}%`));
    console.log(chalk.blue(`Duration: ${(duration / 1000).toFixed(2)}s`));
    console.log(chalk.blue(`Requests/sec: ${(this.results.total / (duration / 1000)).toFixed(2)}`));
    console.log('\n' + chalk.bold('Response Time Statistics (ms):'));
    console.log(chalk.gray(`  Min: ${stats.min}ms`));
    console.log(chalk.gray(`  Max: ${stats.max}ms`));
    console.log(chalk.gray(`  Avg: ${stats.avg}ms`));
    console.log(chalk.gray(`  P50: ${stats.p50}ms`));
    console.log(chalk.gray(`  P95: ${stats.p95}ms`));
    console.log(chalk.gray(`  P99: ${stats.p99}ms`));

    if (this.results.errors.length > 0) {
      console.log('\n' + chalk.red('Errors:'));
      this.results.errors.slice(0, 10).forEach(err => {
        console.log(chalk.red(`  ${err.url}: ${err.error}`));
      });
      if (this.results.errors.length > 10) {
        console.log(chalk.red(`  ... and ${this.results.errors.length - 10} more`));
      }
    }

    console.log(chalk.bold.cyan('='.repeat(60)) + '\n');
  }

  /**
   * Start test
   */
  start() {
    this.results.startTime = Date.now();
  }

  /**
   * End test
   */
  end() {
    this.results.endTime = Date.now();
  }
}

module.exports = TestRunner;

