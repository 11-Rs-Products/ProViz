/**
 * Agent Capability Descriptor
 */
export class AgentCapability {
  constructor({
    propertyKinds = [],
    inputKinds = [],
    outputKinds = [],
    proofKinds = [],
    counterexampleKinds = [],
    executionModes = ['SYNC'],
    supportedConstraints = [],
    supportedLanguages = ['JAVASCRIPT'],
    maxComplexity = 1000
  } = {}) {
    this.propertyKinds = Object.freeze([...new Set(propertyKinds)]);
    this.inputKinds = Object.freeze([...new Set(inputKinds)]);
    this.outputKinds = Object.freeze([...new Set(outputKinds)]);
    this.proofKinds = Object.freeze([...new Set(proofKinds)]);
    this.counterexampleKinds = Object.freeze([...new Set(counterexampleKinds)]);
    this.executionModes = Object.freeze([...new Set(executionModes)]);
    this.supportedConstraints = Object.freeze([...new Set(supportedConstraints)]);
    this.supportedLanguages = Object.freeze([...new Set(supportedLanguages)]);
    this.maxComplexity = maxComplexity;
    Object.freeze(this);
  }

  supportsProperty(propertyKind) {
    return this.propertyKinds.length === 0 || this.propertyKinds.includes(propertyKind) || this.propertyKinds.includes('*');
  }

  supportsLanguage(language) {
    const lang = (language || '').toUpperCase();
    return this.supportedLanguages.length === 0 || this.supportedLanguages.includes(lang) || this.supportedLanguages.includes('*');
  }

  supportsConstraint(constraintKind) {
    return this.supportedConstraints.length === 0 || this.supportedConstraints.includes(constraintKind) || this.supportedConstraints.includes('*');
  }

  supportsProofKind(proofKind) {
    return this.proofKinds.length === 0 || this.proofKinds.includes(proofKind) || this.proofKinds.includes('*');
  }

  matches(requirements = {}) {
    if (requirements.propertyKind && !this.supportsProperty(requirements.propertyKind)) {
      return false;
    }
    if (requirements.language && !this.supportsLanguage(requirements.language)) {
      return false;
    }
    if (requirements.constraintKind && !this.supportsConstraint(requirements.constraintKind)) {
      return false;
    }
    if (requirements.proofKind && !this.supportsProofKind(requirements.proofKind)) {
      return false;
    }
    return true;
  }

  toJSON() {
    return {
      propertyKinds: [...this.propertyKinds],
      inputKinds: [...this.inputKinds],
      outputKinds: [...this.outputKinds],
      proofKinds: [...this.proofKinds],
      counterexampleKinds: [...this.counterexampleKinds],
      executionModes: [...this.executionModes],
      supportedConstraints: [...this.supportedConstraints],
      supportedLanguages: [...this.supportedLanguages],
      maxComplexity: this.maxComplexity
    };
  }

  static fromJSON(json = {}) {
    return new AgentCapability(json);
  }
}
