/**
 * StressExecutor.js
 * Executes controlled stress test experiments in isolated environments.
 */

import { MetricDistribution } from './MetricDistribution.js';
import { ResourceUsageSnapshot } from './ResourceUsageAnalyzer.js';

export class StressResult {
  constructor({ testId, passed = true, degraded = false, peakMemoryBytes = 0, peakCpuPercent = 0, latencyDistribution = null, issues = [] }) {
    this.testId = testId;
    this.passed = passed;
    this.degraded = degraded;
    this.peakMemoryBytes = peakMemoryBytes;
    this.peakCpuPercent = peakCpuPercent;
    this.latencyDistribution = latencyDistribution;
    this.issues = Object.freeze([...issues]);
    Object.freeze(this);
  }

  toJSON() {
    return {
      testId: this.testId,
      passed: this.passed,
      degraded: this.degraded,
      peakMemoryBytes: this.peakMemoryBytes,
      peakCpuPercent: this.peakCpuPercent,
      latencyDistribution: this.latencyDistribution ? this.latencyDistribution.toJSON() : null,
      issues: [...this.issues]
    };
  }
}

export class StressExecutor {
  /**
   * Executes a stress test against a system configuration.
   * @param {StressTest} stressTest
   * @param {Object} [options]
   * @returns {StressResult}
   */
  executeStress(stressTest, options = {}) {
    const intensity = stressTest.intensityLevel;
    const isDegraded = options.simulateDegradation !== undefined ? Boolean(options.simulateDegradation) : intensity >= 8;
    const hasCrashed = options.simulateCrash === true || intensity >= 10;

    const baseLatencies = [10, 12, 14, 15, 18, 20, 22, 25];
    const scaledLatencies = baseLatencies.map(l => l * (isDegraded ? 8 : 1) * (intensity * 0.5));
    const dist = new MetricDistribution(scaledLatencies, 'ms');

    const issues = [];
    if (isDegraded) issues.push('Severe latency tail amplification under stress');
    if (hasCrashed) issues.push('Process crashed or threw OOM exception under extreme stress');

    return new StressResult({
      testId: stressTest.id,
      passed: !hasCrashed,
      degraded: isDegraded,
      peakMemoryBytes: 1024 * 1024 * (30 + intensity * 20),
      peakCpuPercent: Math.min(100, 10 + intensity * 9),
      latencyDistribution: dist,
      issues
    });
  }
}
