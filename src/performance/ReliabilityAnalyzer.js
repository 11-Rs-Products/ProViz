/**
 * ReliabilityAnalyzer.js
 * Calculates empirical reliability properties (failure rate, availability, MTBF) from execution series.
 */

import { ReliabilityModel } from './ReliabilityModel.js';

export class ReliabilityAnalyzer {
  /**
   * Evaluates overall system reliability.
   * @param {Array<Object>} executionRuns
   * @returns {ReliabilityModel}
   */
  evaluateReliability(executionRuns = []) {
    if (!executionRuns || executionRuns.length === 0) {
      return new ReliabilityModel({ id: 'rel:default' });
    }

    const failed = executionRuns.filter(r => r.failed || r.hasError);
    const failureRate = failed.length / executionRuns.length;
    const availability = 1.0 - failureRate;

    return new ReliabilityModel({
      id: `rel:${Date.now()}`,
      failureRate,
      errorRate: failureRate,
      availability: Math.max(0, Math.min(1.0, availability)),
      mtbfHours: failureRate > 0 ? (1.0 / failureRate) * 10 : 10000,
      mttrSeconds: 5
    });
  }
}
