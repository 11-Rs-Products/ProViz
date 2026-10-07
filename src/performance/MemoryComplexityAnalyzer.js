/**
 * MemoryComplexityAnalyzer.js
 * Analyzes spatial memory complexity M(n) including allocations, heap growth, and retained objects.
 */

import { ComplexityClass } from './ComplexityAnalyzer.js';

export class MemoryComplexityAnalyzer {
  /**
   * Estimates memory growth complexity M(n).
   * @param {Array<{ n: number, memoryBytes: number }>} dataPoints
   * @returns {Object}
   */
  estimateMemoryComplexity(dataPoints = []) {
    if (!dataPoints || dataPoints.length < 2) {
      return {
        complexityClass: ComplexityClass.UNKNOWN,
        confidence: 0.0,
        explanation: 'Insufficient data points to estimate memory complexity'
      };
    }

    const sorted = [...dataPoints].sort((a, b) => a.n - b.n);
    const p1 = sorted[0];
    const p2 = sorted[sorted.length - 1];

    if (p1.n === p2.n || p1.memoryBytes <= 0) {
      return { complexityClass: ComplexityClass.O_1, confidence: 0.85, explanation: 'Constant memory overhead observed' };
    }

    const nRatio = p2.n / p1.n;
    const memRatio = p2.memoryBytes / p1.memoryBytes;

    let complexityClass = ComplexityClass.O_N;
    if (memRatio <= 1.2) {
      complexityClass = ComplexityClass.O_1;
    } else if (memRatio <= nRatio * 1.3) {
      complexityClass = ComplexityClass.O_N;
    } else if (memRatio <= Math.pow(nRatio, 2.2)) {
      complexityClass = ComplexityClass.O_N_SQUARED;
    } else {
      complexityClass = ComplexityClass.O_EXPONENTIAL;
    }

    return {
      complexityClass,
      confidence: 0.88,
      nRatio,
      memRatio,
      explanation: `Estimated memory complexity ${complexityClass} across n=[${p1.n}..${p2.n}]`
    };
  }
}
