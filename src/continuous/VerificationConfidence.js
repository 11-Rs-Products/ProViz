/**
 * VerificationConfidence.js
 * Aggregates evidence confidence while strictly preserving distinctions between formal and empirical tiers.
 */

export const EvidenceTier = Object.freeze({
  FORMAL_PROOF: 'FORMAL_PROOF',
  BOUNDED_PROOF: 'BOUNDED_PROOF',
  SYMBOLIC_EVIDENCE: 'SYMBOLIC_EVIDENCE',
  PROBABILISTIC_EVIDENCE: 'PROBABILISTIC_EVIDENCE',
  EMPIRICAL_EVIDENCE: 'EMPIRICAL_EVIDENCE',
  TEST_EVIDENCE: 'TEST_EVIDENCE'
});

const TIER_WEIGHTS = {
  [EvidenceTier.FORMAL_PROOF]: 1.0,
  [EvidenceTier.BOUNDED_PROOF]: 0.85,
  [EvidenceTier.SYMBOLIC_EVIDENCE]: 0.80,
  [EvidenceTier.PROBABILISTIC_EVIDENCE]: 0.70,
  [EvidenceTier.EMPIRICAL_EVIDENCE]: 0.60,
  [EvidenceTier.TEST_EVIDENCE]: 0.50
};

export class VerificationConfidence {
  /**
   * Aggregates a list of evidence items into a normalized confidence score and highest formal level.
   * @param {Array<Object>} evidenceList
   * @returns {{ confidence: number, hasFormalProof: boolean, highestTier: string, tierBreakdown: Object }}
   */
  aggregate(evidenceList) {
    if (!evidenceList || evidenceList.length === 0) {
      return { confidence: 0, hasFormalProof: false, highestTier: 'NONE', tierBreakdown: {} };
    }

    let weightedSum = 0;
    const tierCounts = {};
    let hasFormal = false;

    for (const ev of evidenceList) {
      const tier = ev.tier || ev.type || EvidenceTier.TEST_EVIDENCE;
      const weight = TIER_WEIGHTS[tier] || 0.5;

      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
      weightedSum += weight;

      if (tier === EvidenceTier.FORMAL_PROOF) {
        hasFormal = true;
      }
    }

    const avgConfidence = weightedSum / evidenceList.length;
    const highestTier = hasFormal ? EvidenceTier.FORMAL_PROOF : (Object.keys(tierCounts)[0] || EvidenceTier.TEST_EVIDENCE);

    return {
      confidence: Math.round(avgConfidence * 100) / 100,
      hasFormalProof: hasFormal,
      highestTier,
      tierBreakdown: tierCounts
    };
  }
}
