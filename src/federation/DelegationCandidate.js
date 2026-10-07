/**
 * Evaluated candidate agent with detailed scoring dimensions
 */
export class DelegationCandidate {
  constructor({
    agent,
    capabilityFit = 1.0,
    evidenceQuality = 0.8,
    reliability = 0.9,
    environmentFit = 1.0,
    informationValue = 0.5,
    cost = 0.1,
    latency = 0.1,
    compositeScore = 0.0,
    details = {}
  } = {}) {
    this.agent = agent;
    this.capabilityFit = capabilityFit;
    this.evidenceQuality = evidenceQuality;
    this.reliability = reliability;
    this.environmentFit = environmentFit;
    this.informationValue = informationValue;
    this.cost = cost;
    this.latency = latency;
    this.compositeScore = compositeScore;
    this.details = Object.freeze({ ...details });
    Object.freeze(this);
  }

  toJSON() {
    return {
      agentId: this.agent?.agentId,
      agentName: this.agent?.name,
      capabilityFit: this.capabilityFit,
      evidenceQuality: this.evidenceQuality,
      reliability: this.reliability,
      environmentFit: this.environmentFit,
      informationValue: this.informationValue,
      cost: this.cost,
      latency: this.latency,
      compositeScore: this.compositeScore,
      details: { ...this.details }
    };
  }
}
