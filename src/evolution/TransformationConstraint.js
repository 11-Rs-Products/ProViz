/**
 * TransformationConstraint.js
 * Constraints that a proposed software transformation must strictly or conditionally satisfy.
 */

export const ConstraintType = Object.freeze({
  MUST_PRESERVE_BEHAVIOR: 'MUST_PRESERVE_BEHAVIOR',
  MUST_PRESERVE_API: 'MUST_PRESERVE_API',
  MUST_PRESERVE_CONTRACT: 'MUST_PRESERVE_CONTRACT',
  MUST_PRESERVE_EXCEPTION_SEMANTICS: 'MUST_PRESERVE_EXCEPTION_SEMANTICS',
  MUST_PRESERVE_MEMORY_SAFETY: 'MUST_PRESERVE_MEMORY_SAFETY',
  MUST_PRESERVE_SECURITY: 'MUST_PRESERVE_SECURITY',
  MUST_PRESERVE_TEST_EXPECTATIONS: 'MUST_PRESERVE_TEST_EXPECTATIONS',
  MUST_NOT_INCREASE_COMPLEXITY: 'MUST_NOT_INCREASE_COMPLEXITY',
  MUST_REDUCE_DEPENDENCY_COUPLING: 'MUST_REDUCE_DEPENDENCY_COUPLING',
  MUST_IMPROVE_PERFORMANCE: 'MUST_IMPROVE_PERFORMANCE'
});

export class TransformationConstraint {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.type - ConstraintType
   * @param {boolean} [options.isHard=true] - If true, transformation must be rejected if violated
   * @param {string} [options.description='']
   * @param {Object} [options.parameters={}]
   */
  constructor({
    id,
    type = ConstraintType.MUST_PRESERVE_BEHAVIOR,
    isHard = true,
    description = '',
    parameters = null
  }) {
    if (!id || typeof id !== 'string') {
      throw new Error('TransformationConstraint requires a valid id');
    }

    this.id = id;
    this.type = type;
    this.isHard = Boolean(isHard);
    this.description = description || type;
    this.parameters = parameters ? Object.freeze({ ...parameters }) : Object.freeze({});

    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      isHard: this.isHard,
      description: this.description,
      parameters: this.parameters
    };
  }

  static fromJSON(json) {
    return new TransformationConstraint(json);
  }
}
