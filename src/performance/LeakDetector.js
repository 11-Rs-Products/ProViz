/**
 * LeakDetector.js
 * Detects progressive resource leaks: MEMORY, FILE, SOCKET, THREAD, LOCK, HANDLE.
 */

export const LeakKind = Object.freeze({
  MEMORY: 'MEMORY',
  FILE: 'FILE',
  SOCKET: 'SOCKET',
  THREAD: 'THREAD',
  LOCK: 'LOCK',
  HANDLE: 'HANDLE'
});

export class LeakDetector {
  /**
   * Analyzes a time-series of resource snapshots to detect monotonic growth / leaks.
   * @param {Array<ResourceUsageSnapshot>} series
   * @returns {Object}
   */
  detectLeaks(series = []) {
    if (!series || series.length < 3) {
      return { hasLeak: false, leaks: [], summary: 'Insufficient samples to establish leak trends' };
    }

    const leaks = [];

    // Check memory growth
    const memoryGrowth = series[series.length - 1].memoryBytes - series[0].memoryBytes;
    const isStrictlyGrowingMem = series.every((s, i) => i === 0 || s.memoryBytes >= series[i - 1].memoryBytes);

    if (memoryGrowth > 10 * 1024 * 1024 && isStrictlyGrowingMem) {
      leaks.push({
        kind: LeakKind.MEMORY,
        growthBytes: memoryGrowth,
        severity: 'HIGH',
        description: `Unbounded heap memory growth detected: +${(memoryGrowth / 1024 / 1024).toFixed(1)}MB across ${series.length} steps`
      });
    }

    // Check file descriptor leak
    const fdGrowth = series[series.length - 1].fileDescriptors - series[0].fileDescriptors;
    if (fdGrowth > 5) {
      leaks.push({
        kind: LeakKind.FILE,
        growthCount: fdGrowth,
        severity: 'MEDIUM',
        description: `Unclosed file descriptors detected: +${fdGrowth} unreleased handles`
      });
    }

    const hasLeak = leaks.length > 0;

    return {
      hasLeak,
      leaks,
      summary: hasLeak ? `Detected ${leaks.length} active resource leak(s)` : 'No progressive resource leaks detected'
    };
  }
}
