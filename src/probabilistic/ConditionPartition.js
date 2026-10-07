export class ConditionPartition {
  constructor({
    id,
    predicate,
    predicateSource = 'CFG', // CFG, SYMBOLIC, TYPE, BOUNDARY, SPECIFICATION, EXPLORATION_CLUSTER
    description = '',
    metadata = {}
  }) {
    this.id = id || `partition:${predicateSource}:${predicate}`;
    this.predicate = predicate;
    this.predicateSource = predicateSource;
    this.description = description;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  evaluates(inputContext) {
    if (typeof this.predicate === 'function') {
      try {
        return Boolean(this.predicate(inputContext));
      } catch {
        return false;
      }
    }
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      predicate: typeof this.predicate === 'string' ? this.predicate : String(this.predicate),
      predicateSource: this.predicateSource,
      description: this.description,
      metadata: this.metadata
    };
  }
}
