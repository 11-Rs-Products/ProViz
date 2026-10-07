/**
 * RepairCandidateRanker.js
 * Ranks autonomous repair candidates based on benefit, risk, verification cost, and rollback cost.
 * Utility = Benefit - Risk - VerificationCost - RollbackCost
 */

export class RepairCandidateRanker {
  /**
   * Computes net utility score for a repair candidate.
   * @param {Object} repair
   * @param {number} [repair.benefit=10.0]
   * @param {number} [repair.risk=1.0]
   * @param {number} [repair.verificationCost=1.0]
   * @param {number} [repair.rollbackCost=0.5]
   * @returns {number}
   */
  computeUtility(repair) {
    const benefit = repair.benefit !== undefined ? repair.benefit : 10.0;
    const risk = repair.risk !== undefined ? repair.risk : 1.0;
    const verificationCost = repair.verificationCost !== undefined ? repair.verificationCost : 1.0;
    const rollbackCost = repair.rollbackCost !== undefined ? repair.rollbackCost : 0.5;

    const utility = benefit - risk - verificationCost - rollbackCost;
    return Math.round(utility * 100) / 100;
  }

  /**
   * Ranks an array of repair candidates descending by utility.
   * @param {Array<Object>} candidates
   * @returns {Array<Object>} Sorted candidates with utility scores
   */
  rank(candidates) {
    const scored = candidates.map(c => ({
      ...c,
      utility: this.computeUtility(c)
    }));

    return scored.sort((a, b) => b.utility - a.utility);
  }
}
