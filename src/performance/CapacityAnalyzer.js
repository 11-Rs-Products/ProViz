/**
 * CapacityAnalyzer.js
 * Calculates maximum sustainable throughput and concurrency under given latency thresholds and resource bounds.
 */

import { CapacityModel } from './CapacityModel.js';

export class CapacityAnalyzer {
  /**
   * Derives capacity limits from performance measurements and SLA thresholds.
   * @param {Array<{ rps: number, concurrency: number, latencyP95: number, cpuPercent: number }>} dataPoints
   * @param {Object} slaConstraints - { maxLatencyP95: 200, maxCpuPercent: 80 }
   * @returns {CapacityModel}
   */
  estimateCapacity(dataPoints = [], slaConstraints = {}) {
    const maxLatency = slaConstraints.maxLatencyP95 || 200; // ms
    const maxCpu = slaConstraints.maxCpuPercent || 80; // %

    let safeRps = 100;
    let safeConc = 1;
    let bottleneck = 'NONE';

    for (const p of dataPoints) {
      if (p.latencyP95 <= maxLatency && p.cpuPercent <= maxCpu) {
        if (p.rps > safeRps) {
          safeRps = p.rps;
          safeConc = p.concurrency;
        }
      } else {
        bottleneck = p.latencyP95 > maxLatency ? 'LATENCY_TAIL' : 'CPU';
      }
    }

    return new CapacityModel({
      id: `cap:${Date.now()}`,
      maxSafeRps: safeRps,
      maxConcurrency: safeConc,
      bottleneckResource: bottleneck,
      confidence: 0.92
    });
  }
}
