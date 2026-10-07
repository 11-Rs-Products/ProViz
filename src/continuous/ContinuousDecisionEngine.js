/**
 * ContinuousDecisionEngine.js
 * Evaluates autonomous decisions on changes and repairs using deterministic multi-factor scoring:
 * DecisionScore = EvidenceStrength * Coverage * Freshness * RiskReduction - ResidualRisk - VerificationCost
 */

export const ContinuousDecisionType = Object.freeze({
  ACCEPT: 'ACCEPT',
  ACCEPT_WITH_SCOPE: 'ACCEPT_WITH_SCOPE',
  REJECT: 'REJECT',
  REPAIR: 'REPAIR',
  REVERIFY: 'REVERIFY',
  DEFER: 'DEFER',
  ESCALATE: 'ESCALATE',
  ROLLBACK: 'ROLLBACK',
  INCONCLUSIVE: 'INCONCLUSIVE'
});

export class ContinuousDecisionEngine {
  /**
   * Evaluates project verification state and computes an autonomous decision.
   * @param {Object} context
   * @param {number} [context.evidenceStrength=1.0]
   * @param {number} [context.coverage=1.0]
   * @param {number} [context.freshness=1.0]
   * @param {number} [context.riskReduction=1.0]
   * @param {number} [context.residualRisk=0.0]
   * @param {number} [context.verificationCost=0.1]
   * @param {Array<Object>} [context.failures=[]]
   * @param {boolean} [context.hasSecurityFailure=false]
   * @returns {{ decision: string, score: number, passed: boolean, explanation: string }}
   */
  evaluate({
    evidenceStrength = 1.0,
    coverage = 1.0,
    freshness = 1.0,
    riskReduction = 1.0,
    residualRisk = 0.0,
    verificationCost = 0.1,
    failures = [],
    hasSecurityFailure = false
  } = {}) {
    if (hasSecurityFailure) {
      return {
        decision: ContinuousDecisionType.REJECT,
        score: -10.0,
        passed: false,
        explanation: 'Security gate failed: critical security property violated.'
      };
    }

    if (failures.length > 0) {
      return {
        decision: ContinuousDecisionType.REPAIR,
        score: 0.0,
        passed: false,
        explanation: `${failures.length} verification checks failed. Automated self-healing repair recommended.`
      };
    }

    const score = (evidenceStrength * coverage * freshness * riskReduction) - residualRisk - verificationCost;
    const roundedScore = Math.round(score * 100) / 100;

    let decision = ContinuousDecisionType.ACCEPT;
    if (roundedScore >= 0.8) {
      decision = ContinuousDecisionType.ACCEPT;
    } else if (roundedScore >= 0.5) {
      decision = ContinuousDecisionType.ACCEPT_WITH_SCOPE;
    } else if (roundedScore >= 0.0) {
      decision = ContinuousDecisionType.DEFER;
    } else {
      decision = ContinuousDecisionType.ESCALATE;
    }

    return {
      decision,
      score: roundedScore,
      passed: decision === ContinuousDecisionType.ACCEPT || decision === ContinuousDecisionType.ACCEPT_WITH_SCOPE,
      explanation: `Autonomous decision '${decision}' computed with score ${roundedScore}.`
    };
  }
}
