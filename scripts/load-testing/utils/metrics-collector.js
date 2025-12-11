/**
 * Metrics Collector
 * Collects and aggregates performance metrics
 */

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: [],
      errors: [],
      latencies: [],
      throughput: [],
      concurrentUsers: 0,
      startTime: null,
      endTime: null
    };
  }

  start() {
    this.metrics.startTime = Date.now();
  }

  stop() {
    this.metrics.endTime = Date.now();
  }

  recordRequest(method, endpoint, statusCode, latency) {
    this.metrics.requests.push({
      method,
      endpoint,
      statusCode,
      latency,
      timestamp: Date.now()
    });

    this.metrics.latencies.push(latency);

    if (statusCode >= 400) {
      this.metrics.errors.push({
        method,
        endpoint,
        statusCode,
        latency,
        timestamp: Date.now()
      });
    }
  }

  recordThroughput(requestsPerSecond) {
    this.metrics.throughput.push({
      rps: requestsPerSecond,
      timestamp: Date.now()
    });
  }

  setConcurrentUsers(count) {
    this.metrics.concurrentUsers = count;
  }

  getSummary() {
    const latencies = this.metrics.latencies;
    const sortedLatencies = [...latencies].sort((a, b) => a - b);

    const totalRequests = this.metrics.requests.length;
    const totalErrors = this.metrics.errors.length;
    const duration = this.metrics.endTime - this.metrics.startTime;

    return {
      duration: {
        total: duration,
        seconds: (duration / 1000).toFixed(2)
      },
      requests: {
        total: totalRequests,
        successful: totalRequests - totalErrors,
        failed: totalErrors,
        errorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) + '%' : '0%'
      },
      latency: {
        min: latencies.length > 0 ? Math.min(...latencies) : 0,
        max: latencies.length > 0 ? Math.max(...latencies) : 0,
        avg: latencies.length > 0 ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2) : 0,
        p50: this.percentile(sortedLatencies, 50),
        p95: this.percentile(sortedLatencies, 95),
        p99: this.percentile(sortedLatencies, 99)
      },
      throughput: {
        rps: totalRequests > 0 ? (totalRequests / (duration / 1000)).toFixed(2) : 0,
        avg: this.metrics.throughput.length > 0
          ? (this.metrics.throughput.reduce((a, b) => b.rps + a, 0) / this.metrics.throughput.length).toFixed(2)
          : 0
      },
      concurrentUsers: this.metrics.concurrentUsers
    };
  }

  percentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  getErrors() {
    return this.metrics.errors;
  }

  reset() {
    this.metrics = {
      requests: [],
      errors: [],
      latencies: [],
      throughput: [],
      concurrentUsers: 0,
      startTime: null,
      endTime: null
    };
  }
}

module.exports = { MetricsCollector };

