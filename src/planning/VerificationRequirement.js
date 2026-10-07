export class VerificationRequirement {
  constructor({
    id,
    description,
    target,
    kind = 'SAFETY_PROPERTY',
    predicate = null,
    satisfied = false,
    metadata = {}
  }) {
    this.id = id || `req_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    this.description = String(description || '');
    this.target = String(target || 'general');
    this.kind = kind;
    this.predicate = predicate;
    this.satisfied = Boolean(satisfied);
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  withSatisfied(satisfied = true) {
    return new VerificationRequirement({
      ...this,
      satisfied: Boolean(satisfied)
    });
  }

  toJSON() {
    return {
      id: this.id,
      description: this.description,
      target: this.target,
      kind: this.kind,
      predicate: typeof this.predicate === 'string' ? this.predicate : String(this.predicate),
      metadata: this.metadata
    };
  }
}
