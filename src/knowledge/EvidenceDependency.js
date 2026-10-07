/**
 * Represents a dependency link between evidence artifacts
 */
export class EvidenceDependency {
  constructor({
    sourceEvidenceId,
    targetEvidenceId,
    dependencyType = 'SUPPORTS', // SUPPORTS, PREREQUISITE, VALIDATES, CONTRADICTS
    strength = 1.0,
    confidence = 1.0,
    metadata = {}
  } = {}) {
    if (!sourceEvidenceId || !targetEvidenceId) {
      throw new Error('EvidenceDependency requires sourceEvidenceId and targetEvidenceId');
    }

    this.sourceEvidenceId = sourceEvidenceId;
    this.targetEvidenceId = targetEvidenceId;
    this.dependencyType = dependencyType;
    this.strength = Math.max(0, Math.min(1, strength));
    this.confidence = Math.max(0, Math.min(1, confidence));
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      sourceEvidenceId: this.sourceEvidenceId,
      targetEvidenceId: this.targetEvidenceId,
      dependencyType: this.dependencyType,
      strength: this.strength,
      confidence: this.confidence,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json = {}) {
    return new EvidenceDependency(json);
  }
}
