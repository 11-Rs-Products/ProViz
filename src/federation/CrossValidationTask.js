/**
 * Represents a task to validate evidence produced by one agent using an independent agent
 */
export class CrossValidationTask {
  constructor({
    sourceAgentId,
    validatorAgentId,
    evidence,
    property,
    scope = 'GLOBAL',
    validationMode = 'INDEPENDENT_CHECK'
  } = {}) {
    this.sourceAgentId = sourceAgentId;
    this.validatorAgentId = validatorAgentId;
    this.evidence = evidence;
    this.property = property;
    this.scope = scope;
    this.validationMode = validationMode;
    Object.freeze(this);
  }

  toJSON() {
    return {
      sourceAgentId: this.sourceAgentId,
      validatorAgentId: this.validatorAgentId,
      evidence: this.evidence,
      property: this.property,
      scope: this.scope,
      validationMode: this.validationMode
    };
  }
}
