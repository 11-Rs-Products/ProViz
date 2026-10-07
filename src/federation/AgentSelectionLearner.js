/**
 * Invariants and constraints on federation learning
 */
export class FederationLearningPolicy {
  static validateLearningUpdate(proposedUpdate) {
    // Learning cannot modify proof semantics or evidence strength
    if (proposedUpdate.modifiesProofSemantics || proposedUpdate.overridesFormalLogic) {
      throw new Error('FederationLearningPolicy violation: Learning cannot alter formal verification semantics or evidence strength');
    }
    return true;
  }
}

/**
 * Learns empirical performance profiles per agent
 */
export class AgentPerformanceModel {
  constructor({
    agentId,
    successProbability = 0.9,
    expectedRuntimeMs = 50,
    expectedEvidenceQuality = 0.8,
    resourceEfficiency = 0.85,
    failureProbability = 0.1,
    sampleCount = 0
  } = {}) {
    this.agentId = agentId;
    this.successProbability = successProbability;
    this.expectedRuntimeMs = expectedRuntimeMs;
    this.expectedEvidenceQuality = expectedEvidenceQuality;
    this.resourceEfficiency = resourceEfficiency;
    this.failureProbability = failureProbability;
    this.sampleCount = sampleCount;
    Object.freeze(this);
  }

  update({ success = true, runtimeMs = 50, evidenceQuality = 0.8 }) {
    const count = this.sampleCount + 1;
    const newSuccessProb = (this.successProbability * this.sampleCount + (success ? 1 : 0)) / count;
    const newRuntime = (this.expectedRuntimeMs * this.sampleCount + runtimeMs) / count;
    const newQuality = (this.expectedEvidenceQuality * this.sampleCount + evidenceQuality) / count;

    return new AgentPerformanceModel({
      agentId: this.agentId,
      successProbability: newSuccessProb,
      expectedRuntimeMs: newRuntime,
      expectedEvidenceQuality: newQuality,
      resourceEfficiency: this.resourceEfficiency,
      failureProbability: 1 - newSuccessProb,
      sampleCount: count
    });
  }

  toJSON() {
    return {
      agentId: this.agentId,
      successProbability: this.successProbability,
      expectedRuntimeMs: this.expectedRuntimeMs,
      expectedEvidenceQuality: this.expectedEvidenceQuality,
      resourceEfficiency: this.resourceEfficiency,
      failureProbability: this.failureProbability,
      sampleCount: this.sampleCount
    };
  }
}

/**
 * Online learner that refines agent scoring and selection over time
 */
export class AgentSelectionLearner {
  constructor() {
    this._models = new Map();
  }

  recordObservation(agentId, observation) {
    FederationLearningPolicy.validateLearningUpdate(observation);
    const current = this._models.get(agentId) || new AgentPerformanceModel({ agentId });
    const updated = current.update(observation);
    this._models.set(agentId, updated);
    return updated;
  }

  getPerformanceModel(agentId) {
    return this._models.get(agentId) || new AgentPerformanceModel({ agentId });
  }

  getLearnedScoreBonus(agentId) {
    const model = this.getPerformanceModel(agentId);
    if (model.sampleCount === 0) return 0.0;
    return (model.successProbability * 0.5 + model.expectedEvidenceQuality * 0.5 - (model.expectedRuntimeMs / 2000.0) * 0.2);
  }
}
