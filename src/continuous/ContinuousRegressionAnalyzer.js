/**
 * ContinuousRegressionAnalyzer.js
 * Aggregates functional, security, performance, resource, reliability, concurrency, and API regressions.
 */

export class ContinuousRegressionAnalyzer {
  /**
   * Aggregates stage-specific regression reports into a unified regression report.
   * @param {Object} stageReports
   * @param {Object} [stageReports.functional]
   * @param {Object} [stageReports.security]
   * @param {Object} [stageReports.performance]
   * @param {Object} [stageReports.reliability]
   * @param {Object} [stageReports.concurrency]
   * @param {Object} [stageReports.api]
   * @returns {{ hasRegression: boolean, totalRegressions: number, regressionsByDomain: Object }}
   */
  aggregateRegressions(stageReports = {}) {
    const regressions = {};
    let total = 0;

    for (const [domain, report] of Object.entries(stageReports)) {
      if (report && (report.hasRegression || (Array.isArray(report.regressions) && report.regressions.length > 0))) {
        const count = Array.isArray(report.regressions) ? report.regressions.length : 1;
        regressions[domain] = report;
        total += count;
      }
    }

    return {
      hasRegression: total > 0,
      totalRegressions: total,
      regressionsByDomain: regressions
    };
  }
}
