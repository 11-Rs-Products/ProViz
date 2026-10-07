import { VerificationGoalKind } from './VerificationGoalKind.js';
import { VerificationGoalStatus } from './VerificationGoalStatus.js';

export class VerificationGoal {
  constructor({
    id,
    kind = VerificationGoalKind.PROPERTY,
    target,
    desiredConfidence = 0.95,
    currentConfidence = 0.0,
    requiredEvidence = [],
    acceptableUncertainty = 0.05,
    severity = 'HIGH',
    scope = 'global',
    dependencies = [],
    completionCriteria = null,
    status = VerificationGoalStatus.UNSTARTED,
    rationale = '',
    metadata = {}
  }) {
    this.id = id || `goal_${kind}_${String(target)}_${Date.now()}`;
    this.kind = kind;
    this.target = String(target);
    this.desiredConfidence = Number(desiredConfidence);
    this.currentConfidence = Number(currentConfidence);
    this.requiredEvidence = Object.freeze([...requiredEvidence]);
    this.acceptableUncertainty = Number(acceptableUncertainty);
    this.severity = severity;
    this.scope = scope;
    this.dependencies = Object.freeze([...dependencies]);
    this.completionCriteria = completionCriteria;
    this.status = status;
    this.rationale = String(rationale || '');
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  isSatisfied() {
    return this.status === VerificationGoalStatus.SATISFIED || (this.currentConfidence >= this.desiredConfidence && this.status !== VerificationGoalStatus.FAILED);
  }

  withStatus(newStatus, newConfidence = null) {
    return new VerificationGoal({
      ...this,
      status: newStatus,
      currentConfidence: newConfidence !== null ? Number(newConfidence) : this.currentConfidence
    });
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      target: this.target,
      desiredConfidence: this.desiredConfidence,
      currentConfidence: this.currentConfidence,
      requiredEvidence: this.requiredEvidence,
      acceptableUncertainty: this.acceptableUncertainty,
      severity: this.severity,
      scope: this.scope,
      dependencies: this.dependencies,
      status: this.status,
      rationale: this.rationale,
      metadata: this.metadata
    };
  }
}
