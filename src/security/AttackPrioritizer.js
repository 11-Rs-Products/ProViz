/**
 * AttackPrioritizer.js
 * Prioritizes candidate attacks according to impact, likelihood, reachability, asset sensitivity, and verification cost.
 */

export class AttackPrioritizer {
  /**
   * Prioritizes and sorts attack candidates deterministically.
   * @param {Array<AttackCandidate>} candidates
   * @param {ThreatModel} [threatModel]
   * @returns {Array<AttackCandidate>}
   */
  prioritize(candidates = [], threatModel = null) {
    const list = [...candidates];

    list.sort((a, b) => {
      const valA = a.attackValue;
      const valB = b.attackValue;
      if (valB !== valA) return valB - valA;
      return a.id.localeCompare(b.id);
    });

    return list;
  }
}
