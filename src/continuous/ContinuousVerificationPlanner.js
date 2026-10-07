/**
 * ContinuousVerificationPlanner.js
 * Prioritizes verification obligations based on risk, impact, staleness, uncertainty, and cost.
 * Priority(o) = Risk(o) * Impact(o) * (1 + Staleness(o)) * Uncertainty(o) * InformationValue(o) / Cost(o)
 */

export class ContinuousVerificationPlanner {
  /**
   * Computes priority score for a VerificationObligation.
   * @param {import('./VerificationObligation.js').VerificationObligation} obligation
   * @param {Object} [context={}]
   * @param {number} [context.uncertainty=1.0]
   * @param {number} [context.informationValue=1.0]
   * @returns {number} Priority score
   */
  computePriority(obligation, { uncertainty = 1.0, informationValue = 1.0 } = {}) {
    const risk = obligation.risk || 1.0;
    const impact = obligation.impact || 1.0;
    const stalenessFactor = 1.0 + (obligation.staleness || 0) * 0.5;
    const cost = Math.max(0.1, obligation.cost || 1.0);

    const score = (risk * impact * stalenessFactor * uncertainty * informationValue) / cost;
    return Math.round(score * 100) / 100;
  }

  /**
   * Plans and orders a list of obligations into an optimal verification sequence.
   * @param {Array<import('./VerificationObligation.js').VerificationObligation>} obligations
   * @param {Object} [context={}]
   * @returns {Array<{ obligation: import('./VerificationObligation.js').VerificationObligation, priority: number }>}
   */
  plan(obligations, context = {}) {
    const scored = obligations.map(obl => ({
      obligation: obl,
      priority: this.computePriority(obl, context)
    }));

    // Sort descending by priority
    return scored.sort((a, b) => b.priority - a.priority);
  }
}
