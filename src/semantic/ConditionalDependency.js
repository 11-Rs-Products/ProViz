/**
 * ConditionalDependency.js
 * Models conditional/path-gated dependencies (A -> B iff Condition C holds).
 */

export class ConditionalDependency {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.sourceId
   * @param {string} options.targetId
   * @param {Object} options.condition - { type: 'BRANCH'|'SYMBOLIC'|'ENV'|'CONFIG'|'TYPE', expression: string, value: any }
   * @param {number} [options.probability=1.0] - Probability of condition being satisfied
   */
  constructor({
    id,
    sourceId,
    targetId,
    condition,
    probability = 1.0
  }) {
    if (!id || !sourceId || !targetId || !condition) {
      throw new Error('ConditionalDependency requires id, sourceId, targetId, and condition');
    }

    this.id = id;
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.condition = Object.freeze({ ...condition });
    this.probability = Math.max(0.0, Math.min(1.0, Number(probability) || 1.0));

    Object.freeze(this);
  }

  evaluate(context = {}) {
    if (!this.condition) return true;
    const { type, expression, value } = this.condition;

    if (type === 'ENV') {
      return context.env && context.env[expression] === value;
    }
    if (type === 'CONFIG') {
      return context.config && context.config[expression] === value;
    }
    if (type === 'BRANCH') {
      return context.branchState ? context.branchState[expression] === value : true;
    }
    if (type === 'SYMBOLIC') {
      return context.constraints ? context.constraints.includes(expression) : true;
    }
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      sourceId: this.sourceId,
      targetId: this.targetId,
      condition: this.condition,
      probability: this.probability
    };
  }

  static fromJSON(json) {
    return new ConditionalDependency(json);
  }
}
