/**
 * AutonomousDecisionEngine.js
 * Evaluates multi-domain evidence, policy compliance, and residual risk to produce actionable, explainable global decisions.
 */

export const DecisionClass = Object.freeze({
  ACCEPT: 'ACCEPT',
  ACCEPT_WITH_SCOPE: 'ACCEPT_WITH_SCOPE',
  REJECT: 'REJECT',
  REPAIR: 'REPAIR',
  REVERIFY: 'REVERIFY',
  DEFER: 'DEFER',
  ESCALATE: 'ESCALATE',
  ROLLBACK: 'ROLLBACK',
  PAUSE: 'PAUSE',
  INCONCLUSIVE: 'INCONCLUSIVE',
  CERTIFY: 'CERTIFY'
});

export class DecisionExplanation {
  /**
   * @param {Object} options
   * @param {string} options.decisionClass
   * @param {string} options.summary
   * @param {string[]} [options.supportingEvidence=[]]
   * @param {string[]} [options.identifiedRisks=[]]
   * @param {string[]} [options.governingPolicies=[]]
   */
  constructor({
    decisionClass,
    summary,
    supportingEvidence = [],
    identifiedRisks = [],
    governingPolicies = []
  }) {
    this.decisionClass = decisionClass;
    this.summary = summary;
    this.supportingEvidence = Object.freeze([...supportingEvidence]);
    this.identifiedRisks = Object.freeze([...identifiedRisks]);
    this.governingPolicies = Object.freeze([...governingPolicies]);
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      decisionClass: this.decisionClass,
      summary: this.summary,
      supportingEvidence: [...this.supportingEvidence],
      identifiedRisks: [...this.identifiedRisks],
      governingPolicies: [...this.governingPolicies],
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new DecisionExplanation(json);
  }
}

export class AutonomousDecision {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.decisionClass - from DecisionClass
   * @param {number} options.score - Decision score heuristic
   * @param {number} [options.confidence=1.0]
   * @param {DecisionExplanation} options.explanation
   * @param {Object} [options.context={}]
   */
  constructor({
    id,
    decisionClass,
    score,
    confidence = 1.0,
    explanation,
    context = {}
  }) {
    this.id = id || `DEC_${decisionClass}_${Date.now()}`;
    this.decisionClass = decisionClass;
    this.score = Number(score.toFixed(4));
    this.confidence = confidence;
    this.explanation = explanation instanceof DecisionExplanation ? explanation : new DecisionExplanation(explanation);
    this.context = Object.freeze({ ...context });
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      decisionClass: this.decisionClass,
      score: this.score,
      confidence: this.confidence,
      explanation: this.explanation.toJSON(),
      context: this.context,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new AutonomousDecision(json);
  }
}

export class AutonomousDecisionEngine {
  /**
   * Evaluate global decision from evidence and policy context
   * Formula:
   * DecisionScore = EvidenceStrength * Coverage * Freshness * RiskReduction * PolicyCompliance - ResidualRisk - VerificationCost - Uncertainty
   * @param {Object} params
   */
  evaluate(params = {}) {
    const {
      evidenceStrength = 1.0,
      coverage = 1.0,
      freshness = 1.0,
      riskReduction = 0.8,
      policyCompliance = 1.0,
      residualRisk = 0.1,
      verificationCost = 0.05,
      uncertainty = 0.05,
      hasCriticalViolation = false,
      requiresHumanApproval = false
    } = params;

    const positiveTerm = evidenceStrength * coverage * freshness * riskReduction * policyCompliance;
    const penaltyTerm = residualRisk + verificationCost + uncertainty;
    const score = positiveTerm - penaltyTerm;

    let decisionClass = DecisionClass.ACCEPT;
    let summary = 'Verification evidence meets all criteria; modification approved';

    if (hasCriticalViolation) {
      decisionClass = DecisionClass.REJECT;
      summary = 'Critical security or governance violation detected; modification rejected';
    } else if (requiresHumanApproval) {
      decisionClass = DecisionClass.ESCALATE;
      summary = 'High risk or policy condition requires explicit operator approval';
    } else if (score < 0.2) {
      decisionClass = DecisionClass.REPAIR;
      summary = 'Verification score below threshold; automated repair recommended';
    }

    const explanation = new DecisionExplanation({
      decisionClass,
      summary,
      supportingEvidence: [`Score: ${score.toFixed(4)}`, `Coverage: ${coverage}`, `Freshness: ${freshness}`],
      identifiedRisks: hasCriticalViolation ? ['Critical gate violation'] : [],
      governingPolicies: ['AutonomousDecisionPolicy']
    });

    return new AutonomousDecision({
      decisionClass,
      score,
      confidence: Math.max(0.1, 1.0 - uncertainty),
      explanation,
      context: params
    });
  }
}
