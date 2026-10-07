export class VerificationDependency {
  constructor({
    source,
    target,
    sourceId,
    targetId,
    relation = 'REQUIRES', // REQUIRES, INVALIDATES, REFINES, DERIVED_FROM, VALIDATES
    kind,
    metadata = {}
  }) {
    this.sourceId = String(sourceId ?? source ?? '');
    this.targetId = String(targetId ?? target ?? '');
    this.source = this.sourceId;
    this.target = this.targetId;
    this.relation = relation || kind || 'REQUIRES';
    this.kind = this.relation;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      sourceId: this.sourceId,
      targetId: this.targetId,
      relation: this.relation,
      metadata: this.metadata
    };
  }
}
