/**
 * ComplexityAnalyzer.js
 * Analyzes and estimates empirical or symbolic computational complexity T(n):
 * O(1), O(log n), O(n), O(n log n), O(n^2), O(2^n), UNKNOWN.
 */

export const ComplexityClass = Object.freeze({
  O_1: 'O(1)',
  O_LOG_N: 'O(log n)',
  O_N: 'O(n)',
  O_N_LOG_N: 'O(n log n)',
  O_N_SQUARED: 'O(n^2)',
  O_EXPONENTIAL: 'O(2^n)',
  UNKNOWN: 'UNKNOWN'
});

export class ComplexityAnalyzer {
  /**
   * Estimates computational time complexity from scaling data points.
   * @param {Array<{ n: number, timeMs: number }>} dataPoints
   * @returns {Object}
   */
  estimateComplexity(dataPoints = []) {
    if (!dataPoints || dataPoints.length < 2) {
      return {
        complexityClass: ComplexityClass.UNKNOWN,
        confidence: 0.0,
        explanation: 'Insufficient data points to estimate complexity'
      };
    }

    const sorted = [...dataPoints].sort((a, b) => a.n - b.n);
    const p1 = sorted[0];
    const p2 = sorted[sorted.length - 1];

    if (p1.n === p2.n || p1.timeMs <= 0) {
      return { complexityClass: ComplexityClass.O_1, confidence: 0.85, explanation: 'Constant time execution observed' };
    }

    const nRatio = p2.n / p1.n;
    const timeRatio = p2.timeMs / p1.timeMs;

    let complexityClass = ComplexityClass.O_N;
    let confidence = 0.85;

    if (timeRatio <= 1.2) {
      complexityClass = ComplexityClass.O_1;
    } else if (timeRatio <= Math.log2(nRatio) * 1.5) {
      complexityClass = ComplexityClass.O_LOG_N;
    } else if (timeRatio <= nRatio * 1.3) {
      complexityClass = ComplexityClass.O_N;
    } else if (timeRatio <= nRatio * Math.log2(nRatio) * 1.4) {
      complexityClass = ComplexityClass.O_N_LOG_N;
    } else if (timeRatio <= Math.pow(nRatio, 2.2)) {
      complexityClass = ComplexityClass.O_N_SQUARED;
    } else {
      complexityClass = ComplexityClass.O_EXPONENTIAL;
      confidence = 0.90;
    }

    return {
      complexityClass,
      confidence,
      nRatio,
      timeRatio,
      explanation: `Estimated ${complexityClass} scaling behavior based on ${dataPoints.length} workload samples`
    };
  }
}
