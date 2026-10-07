export class BehaviorOutcome {
  constructor({
    id,
    type = 'RETURN', // RETURN, EXCEPTION, STATE_MUTATION, TIMEOUT, DIVERGENT
    value = null,
    exceptionType = null,
    behaviorCluster = 'default',
    metadata = {}
  }) {
    this.id = id || `${type}:${exceptionType || (typeof value === 'object' ? JSON.stringify(value) : String(value))}`;
    this.type = type;
    this.value = value;
    this.exceptionType = exceptionType;
    this.behaviorCluster = behaviorCluster;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  isException() {
    return this.type === 'EXCEPTION';
  }

  isReturn() {
    return this.type === 'RETURN';
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      value: this.value,
      exceptionType: this.exceptionType,
      behaviorCluster: this.behaviorCluster,
      metadata: this.metadata
    };
  }
}
