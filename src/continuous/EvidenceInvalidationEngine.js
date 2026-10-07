/**
 * EvidenceInvalidationEngine.js
 * Selectively invalidates only evidence whose assumptions or dependencies were affected by a change.
 */

import { VerificationFreshness } from './VerificationFreshness.js';
import { StalenessAnalyzer } from './StalenessAnalyzer.js';

export class EvidenceInvalidationEngine {
  constructor(stalenessAnalyzer = new StalenessAnalyzer()) {
    this.stalenessAnalyzer = stalenessAnalyzer;
  }

  /**
   * Partitions an evidence list into reusable (fresh) and invalidated (stale/invalidated) sets.
   * @param {Array<Object>} evidenceList
   * @param {import('./ChangeSet.js').ChangeSet} changeSet
   * @param {Array<string>} [affectedEntities=[]]
   * @returns {{ reusable: Array<Object>, invalidated: Array<Object>, summary: Object }}
   */
  processInvalidation(evidenceList, changeSet, affectedEntities = []) {
    const reusable = [];
    const invalidated = [];

    for (const ev of evidenceList) {
      const evalResult = this.stalenessAnalyzer.evaluateFreshness(ev, changeSet, affectedEntities);
      if (evalResult.isApplicable) {
        reusable.push({ ...ev, freshness: evalResult.status });
      } else {
        invalidated.push({ ...ev, freshness: evalResult.status, invalidationReason: evalResult.reason });
      }
    }

    return {
      reusable,
      invalidated,
      summary: {
        total: evidenceList.length,
        reusableCount: reusable.length,
        invalidatedCount: invalidated.length,
        reuseRatePct: evidenceList.length > 0 ? (reusable.length / evidenceList.length) * 100 : 100
      }
    };
  }
}
