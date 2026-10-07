/**
 * VerificationObligation.js
 * Represents a verification obligation produced after a project modification.
 */

export const ObligationKind = Object.freeze({
  NULL_SAFETY: 'NULL_SAFETY',
  TYPE_SAFETY: 'TYPE_SAFETY',
  CONTRACT_PRESERVATION: 'CONTRACT_PRESERVATION',
  SECURITY_PROPERTY: 'SECURITY_PROPERTY',
  PERFORMANCE_THRESHOLD: 'PERFORMANCE_THRESHOLD',
  RESOURCE_BOUND: 'RESOURCE_BOUND',
  RACE_FREEDOM: 'RACE_FREEDOM',
  DEADLOCK_FREEDOM: 'DEADLOCK_FREEDOM',
  TEMPORAL_PROPERTY: 'TEMPORAL_PROPERTY',
  API_COMPATIBILITY: 'API_COMPATIBILITY',
  TEST_ADEQUACY: 'TEST_ADEQUACY',
  RELIABILITY_BOUND: 'RELIABILITY_BOUND'
});

export class VerificationObligation {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.kind
   * @param {string} options.targetEntity
   * @param {string} [options.property='']
   * @param {number} [options.risk=1.0]
   * @param {number} [options.impact=1.0]
   * @param {number} [options.cost=1.0] Estimated computational cost
   * @param {number} [options.staleness=0]
   * @param {Array<string>} [options.dependencies=[]]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    kind,
    targetEntity,
    property = '',
    risk = 1.0,
    impact = 1.0,
    cost = 1.0,
    staleness = 0,
    dependencies = [],
    metadata = {}
  }) {
    if (!id || !kind || !targetEntity) {
      throw new Error('VerificationObligation requires id, kind, and targetEntity');
    }
    this.id = id;
    this.kind = kind;
    this.targetEntity = targetEntity;
    this.property = property || kind;
    this.risk = risk;
    this.impact = impact;
    this.cost = Math.max(0.1, cost);
    this.staleness = staleness;
    this.dependencies = Object.freeze([...dependencies]);
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      targetEntity: this.targetEntity,
      property: this.property,
      risk: this.risk,
      impact: this.impact,
      cost: this.cost,
      staleness: this.staleness,
      dependencies: [...this.dependencies],
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new VerificationObligation(json);
  }
}
