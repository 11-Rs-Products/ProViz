import { AgentTrustLevel, TRUST_LEVEL_ORDER } from './AgentTrustLevel.js';

/**
 * Represents an individual agent's vote/assessment on a claim
 */
export class EvidenceVote {
  constructor({
    agentId,
    evidenceKind = 'EMPIRICAL_OBSERVATION',
    trustLevel = AgentTrustLevel.STANDARD,
    claim = 'SAFETY',
    resultStatus = 'PROVED',
    confidence = 0.9,
    scope = 'GLOBAL',
    payload = {}
  } = {}) {
    this.agentId = agentId;
    this.evidenceKind = evidenceKind;
    this.trustLevel = trustLevel;
    this.claim = claim;
    this.resultStatus = resultStatus;
    this.confidence = Math.max(0, Math.min(1, confidence));
    this.scope = scope;
    this.payload = Object.freeze({ ...payload });
    Object.freeze(this);
  }

  get rank() {
    return TRUST_LEVEL_ORDER[this.trustLevel] ?? 0;
  }

  toJSON() {
    return {
      agentId: this.agentId,
      evidenceKind: this.evidenceKind,
      trustLevel: this.trustLevel,
      claim: this.claim,
      resultStatus: this.resultStatus,
      confidence: this.confidence,
      scope: this.scope,
      payload: { ...this.payload }
    };
  }

  static fromJSON(json = {}) {
    return new EvidenceVote(json);
  }
}
