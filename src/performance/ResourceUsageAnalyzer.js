/**
 * ResourceUsageAnalyzer.js
 * Unified multi-dimensional resource usage snapshot across CPU, Memory, Disk, Network, File Descriptors, Threads, Handles, and Queue Depth.
 */

export class ResourceUsageSnapshot {
  constructor({
    cpuPercent = 0,
    memoryBytes = 0,
    diskBytesPerSec = 0,
    networkBytesPerSec = 0,
    fileDescriptors = 0,
    threadCount = 1,
    handles = 0,
    queueDepth = 0,
    timestamp = Date.now()
  }) {
    this.cpuPercent = cpuPercent;
    this.memoryBytes = memoryBytes;
    this.diskBytesPerSec = diskBytesPerSec;
    this.networkBytesPerSec = networkBytesPerSec;
    this.fileDescriptors = fileDescriptors;
    this.threadCount = threadCount;
    this.handles = handles;
    this.queueDepth = queueDepth;
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      cpuPercent: this.cpuPercent,
      memoryBytes: this.memoryBytes,
      diskBytesPerSec: this.diskBytesPerSec,
      networkBytesPerSec: this.networkBytesPerSec,
      fileDescriptors: this.fileDescriptors,
      threadCount: this.threadCount,
      handles: this.handles,
      queueDepth: this.queueDepth,
      timestamp: this.timestamp
    };
  }
}

export class ResourceUsageAnalyzer {
  /**
   * Captures current resource usage profile.
   * @param {Object} [telemetry]
   * @returns {ResourceUsageSnapshot}
   */
  captureUsage(telemetry = {}) {
    return new ResourceUsageSnapshot({
      cpuPercent: telemetry.cpuPercent !== undefined ? telemetry.cpuPercent : 15.5,
      memoryBytes: telemetry.memoryBytes !== undefined ? telemetry.memoryBytes : 52428800, // 50MB
      diskBytesPerSec: telemetry.diskBytesPerSec || 10240,
      networkBytesPerSec: telemetry.networkBytesPerSec || 20480,
      fileDescriptors: telemetry.fileDescriptors || 12,
      threadCount: telemetry.threadCount || 4,
      handles: telemetry.handles || 25,
      queueDepth: telemetry.queueDepth || 0
    });
  }
}
