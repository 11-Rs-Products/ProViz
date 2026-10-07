/**
 * PerformanceChangeImpact.js
 * Evaluates the performance impact of semantic program changes:
 * Semantic Change -> Affected Hot Path -> Affected Workload -> Affected Metric -> Regression Risk.
 */

export class PerformanceChangeImpact {
  /**
   * Analyzes impact of semantic changes on hot paths and performance metrics.
   * @param {Object} semanticDiff
   * @param {Array<HotPath>} hotPaths
   * @param {PerformanceModel} [performanceModel]
   * @returns {Object}
   */
  evaluateChangeImpact(semanticDiff = {}, hotPaths = [], performanceModel = null) {
    const affectedHotPaths = [];
    const modifiedSymbols = semanticDiff.modifiedSymbols || semanticDiff.affectedNodes || [];

    for (const hp of hotPaths) {
      if (hp.nodeIds.some(nid => modifiedSymbols.includes(nid))) {
        affectedHotPaths.push(hp);
      }
    }

    const isHotPathModified = affectedHotPaths.length > 0;
    const estimatedRegressionRisk = isHotPathModified ? 0.85 : 0.15;

    return {
      isHotPathModified,
      affectedHotPaths,
      affectedCount: affectedHotPaths.length,
      estimatedRegressionRisk,
      recommendation: isHotPathModified
        ? 'High performance regression risk: thorough benchmark re-verification required'
        : 'Low performance regression risk: non-critical path modified'
    };
  }
}
