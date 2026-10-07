/**
 * SafetyProperty.js
 * Formal safety properties generalizing invariants beyond direct security attacks.
 */

export const SafetyPropertyKind = Object.freeze({
  MUST_NOT_REACH_STATE: 'MUST_NOT_REACH_STATE',
  MUST_NOT_EXECUTE_OPERATION: 'MUST_NOT_EXECUTE_OPERATION',
  MUST_NOT_EXCEED_RESOURCE: 'MUST_NOT_EXCEED_RESOURCE',
  MUST_NOT_VIOLATE_INVARIANT: 'MUST_NOT_VIOLATE_INVARIANT',
  MUST_REMAIN_WITHIN_BOUND: 'MUST_REMAIN_WITHIN_BOUND'
});

export class SafetyProperty {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.kind - SafetyPropertyKind
   * @param {string} options.expression
   * @param {string} [options.description='']
   * @param {Object} [options.attributes={}]
   */
  constructor({
    id,
    kind = SafetyPropertyKind.MUST_NOT_REACH_STATE,
    expression,
    description = '',
    attributes = {}
  }) {
    if (!id || !expression) throw new Error('SafetyProperty requires id and expression');
    this.id = id;
    this.kind = kind;
    this.expression = expression;
    this.description = description || `${kind}: ${expression}`;
    this.attributes = Object.freeze({ ...attributes });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      expression: this.expression,
      description: this.description,
      attributes: { ...this.attributes }
    };
  }

  static fromJSON(json) {
    return new SafetyProperty(json);
  }
}
