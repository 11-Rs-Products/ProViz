/**
 * RegressionSelector.js
 * Selects an optimal, risk-prioritized subset of regression tests and verification campaigns.
 */

import { TestImpactAnalyzer } from './TestImpactAnalyzer.js';

export class RegressionSelector {
  constructor(testAnalyzer = null) {
    this.testAnalyzer = testAnalyzer || new TestImpactAnalyzer();
  }

  selectTests(change, programGraph, options = {}) {
    const ranked = this.testAnalyzer.rankTests(change, programGraph, options.testMetadata || {});
    const minScore = options.minScore || 0.2;
    const maxTests = options.maxTests || 50;

    const selected = ranked.filter(t => t.score >= minScore).slice(0, maxTests);

    return {
      changeId: change.id,
      targetId: change.targetId,
      totalCandidateTests: ranked.length,
      selectedTests: selected,
      selectedTestIds: selected.map(t => t.testId),
      estimatedCoverage: selected.length > 0 ? selected[0].factors.coverage : 0.0
    };
  }
}
