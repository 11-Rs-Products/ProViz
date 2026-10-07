/**
 * Identifies verification capabilities that are unavailable in the federation
 */
export class CapabilityGap {
  constructor({
    goalId,
    requiredCapability,
    missingLanguages = [],
    missingProperties = [],
    missingConstraints = [],
    missingEvidence = [],
    description = '',
    severity = 'HIGH'
  } = {}) {
    this.goalId = goalId || 'unknown-goal';
    this.requiredCapability = requiredCapability || 'UNSPECIFIED_CAPABILITY';
    this.missingLanguages = Object.freeze([...missingLanguages]);
    this.missingProperties = Object.freeze([...missingProperties]);
    this.missingConstraints = Object.freeze([...missingConstraints]);
    this.missingEvidence = Object.freeze([...missingEvidence]);
    this.description = description;
    this.severity = severity;
    Object.freeze(this);
  }

  toJSON() {
    return {
      goalId: this.goalId,
      requiredCapability: this.requiredCapability,
      missingLanguages: [...this.missingLanguages],
      missingProperties: [...this.missingProperties],
      missingConstraints: [...this.missingConstraints],
      missingEvidence: [...this.missingEvidence],
      description: this.description,
      severity: this.severity
    };
  }

  static fromJSON(json = {}) {
    return new CapabilityGap(json);
  }
}
