import os from 'os';

interface MetricsSnapshot {
  service: string;
  uptimeSeconds: number;
  processMemoryMB: number;
  systemLoadAvg: number[];
  timestamp: string;
}

export class MetricsService {
  getSnapshot(): MetricsSnapshot {
    const mem = process.memoryUsage();
    const processMemoryMB = Math.round((mem.rss / 1024 / 1024) * 100) / 100;
    return {
      service: 'meetings-service',
      uptimeSeconds: Math.round(process.uptime()),
      processMemoryMB,
      systemLoadAvg: os.loadavg(),
      timestamp: new Date().toISOString()
    };
  }
}

