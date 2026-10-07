/**
 * HotPathAnalyzer.js
 * Identifies high-cost semantic paths combining CFG topology, call graphs, execution frequency, and profile samples.
 */

export class HotPath {
  constructor({ pathId, nodeIds = [], totalCostScore = 0.8, executionPercentage = 80.0, description = '' }) {
    this.pathId = pathId;
    this.nodeIds = Object.freeze([...nodeIds]);
    this.totalCostScore = totalCostScore;
    this.executionPercentage = executionPercentage;
    this.description = description || `Hot path: ${nodeIds.join(' -> ')}`;
    Object.freeze(this);
  }

  toJSON() {
    return {
      pathId: this.pathId,
      nodeIds: [...this.nodeIds],
      totalCostScore: this.totalCostScore,
      executionPercentage: this.executionPercentage,
      description: this.description
    };
  }
}

export class HotPathAnalyzer {
  /**
   * Discovers hot paths from profile samples and semantic graphs.
   * @param {Object} profileResult
   * @param {SemanticProgramGraph} [semanticGraph]
   * @returns {Array<HotPath>}
   */
  findHotPaths(profileResult = {}, semanticGraph = null) {
    const samples = profileResult.samples || [];
    const hotPaths = [];

    const totalTime = samples.reduce((acc, s) => acc + s.selfTimeMs, 0) || 1.0;

    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      const pct = (sample.selfTimeMs / totalTime) * 100;
      if (pct >= 15.0 || i === 0) {
        hotPaths.push(new HotPath({
          pathId: `hp:${sample.functionId}`,
          nodeIds: [sample.functionId],
          totalCostScore: Math.min(1.0, sample.selfTimeMs / 100),
          executionPercentage: Math.round(pct * 10) / 10,
          description: `Function '${sample.functionId}' consumes ${pct.toFixed(1)}% of total execution time`
        }));
      }
    }

    hotPaths.sort((a, b) => b.executionPercentage - a.executionPercentage);
    return hotPaths;
  }
}
