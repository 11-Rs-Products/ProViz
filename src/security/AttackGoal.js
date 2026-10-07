/**
 * AttackGoal.js
 * Represents canonical adversarial objectives and goals.
 */

export const AttackGoalCategory = Object.freeze({
  BYPASS_AUTHORIZATION: 'BYPASS_AUTHORIZATION',
  LEAK_SECRET: 'LEAK_SECRET',
  CORRUPT_STATE: 'CORRUPT_STATE',
  VIOLATE_INTEGRITY: 'VIOLATE_INTEGRITY',
  EXHAUST_RESOURCE: 'EXHAUST_RESOURCE',
  CROSS_TRUST_BOUNDARY: 'CROSS_TRUST_BOUNDARY',
  ESCALATE_PRIVILEGE: 'ESCALATE_PRIVILEGE',
  TRIGGER_UNSAFE_STATE: 'TRIGGER_UNSAFE_STATE',
  BYPASS_VALIDATION: 'BYPASS_VALIDATION',
  REACH_PROTECTED_SINK: 'REACH_PROTECTED_SINK'
});

export class AttackGoal {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.category - AttackGoalCategory
   * @param {string} options.targetAssetId
   * @param {string} [options.targetSinkId='']
   * @param {string} [options.description='']
   * @param {number} [options.severity=0.8]
   * @param {Object} [options.criteria={}]
   */
  constructor({
    id,
    category = AttackGoalCategory.BYPASS_AUTHORIZATION,
    targetAssetId,
    targetSinkId = '',
    description = '',
    severity = 0.8,
    criteria = {}
  }) {
    if (!id || !targetAssetId) throw new Error('AttackGoal requires id and targetAssetId');
    this.id = id;
    this.category = category;
    this.targetAssetId = targetAssetId;
    this.targetSinkId = targetSinkId;
    this.description = description || `${category} on ${targetAssetId}`;
    this.severity = Math.max(0.0, Math.min(1.0, Number(severity) || 0.8));
    this.criteria = Object.freeze({ ...criteria });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      category: this.category,
      targetAssetId: this.targetAssetId,
      targetSinkId: this.targetSinkId,
      description: this.description,
      severity: this.severity,
      criteria: { ...this.criteria }
    };
  }

  static fromJSON(json) {
    return new AttackGoal(json);
  }
}
