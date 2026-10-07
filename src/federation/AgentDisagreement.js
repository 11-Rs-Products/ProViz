/**
 * Captures explicit disagreement between two verification agents
 */
export class AgentDisagreement {
  constructor({
    agentA,
    agentB,
    claim = 'SAFETY',
    resultA,
    resultB,
    scopeA = 'GLOBAL',
    scopeB = 'GLOBAL',
    environmentA = null,
    environmentB = null,
    classification = 'TRUE_CONTRADICTION',
    details = {},
    timestamp = Date.now()
  } = {}) {
    this.agentA = agentA;
    this.agentB = agentB;
    this.claim = claim;
    this.resultA = resultA;
    this.resultB = resultB;
    this.scopeA = scopeA;
    this.scopeB = scopeB;
    this.environmentA = environmentA;
    this.environmentB = environmentB;
    this.classification = classification;
    this.details = Object.freeze({ ...details });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      agentA: typeof this.agentA === 'string' ? this.agentA : this.agentA?.agentId,
      agentB: typeof this.agentB === 'string' ? this.agentB : this.agentB?.agentId,
      claim: this.claim,
      resultA: this.resultA,
      resultB: this.resultB,
      scopeA: this.scopeA,
      scopeB: this.scopeB,
      environmentA: this.environmentA,
      environmentB: this.environmentB,
      classification: this.classification,
      details: { ...this.details },
      timestamp: this.timestamp
    };
  }

  static fromJSON(json = {}) {
    return new AgentDisagreement(json);
  }
}
