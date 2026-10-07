/**
 * SecurityConstraint.js
 * Formal security constraints suitable for SMT/Symbolic solvers and concolic engines.
 */

export const ConstraintEnforcement = Object.freeze({
  HARD: 'HARD',
  SOFT: 'SOFT',
  AUDIT: 'AUDIT'
});

export class SecurityConstraint {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.name
   * @param {string} options.smtExpression
   * @param {string} [options.targetNodeId='']
   * @param {string} [options.enforcement=ConstraintEnforcement.HARD]
   * @param {Object} [options.attributes={}]
   */
  constructor({
    id,
    name,
    smtExpression,
    targetNodeId = '',
    enforcement = ConstraintEnforcement.HARD,
    attributes = {}
  }) {
    if (!id || !smtExpression) throw new Error('SecurityConstraint requires id and smtExpression');
    this.id = id;
    this.name = name || id;
    this.smtExpression = smtExpression;
    this.targetNodeId = targetNodeId;
    this.enforcement = enforcement;
    this.attributes = Object.freeze({ ...attributes });
    Object.freeze(this);
  }

  isHard() {
    return this.enforcement === ConstraintEnforcement.HARD;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      smtExpression: this.smtExpression,
      targetNodeId: this.targetNodeId,
      enforcement: this.enforcement,
      attributes: { ...this.attributes }
    };
  }

  static fromJSON(json) {
    return new SecurityConstraint(json);
  }
}
