/**
 * TransformationPrecondition.js
 * Validates structural and semantic prerequisites before applying a transformation.
 */

export class TransformationPrecondition {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.ruleName
   * @param {Function} [options.checkFn] - (transformation, semanticGraph) => boolean
   * @param {string} [options.failureMessage='']
   */
  constructor({
    id,
    ruleName,
    checkFn = null,
    failureMessage = ''
  }) {
    if (!id || !ruleName) {
      throw new Error('TransformationPrecondition requires id and ruleName');
    }

    this.id = id;
    this.ruleName = ruleName;
    this.checkFn = checkFn || (() => true);
    this.failureMessage = failureMessage || `Precondition '${ruleName}' failed`;

    Object.freeze(this);
  }

  evaluate(transformation, semanticGraph) {
    try {
      const satisfied = Boolean(this.checkFn(transformation, semanticGraph));
      return {
        id: this.id,
        ruleName: this.ruleName,
        satisfied,
        message: satisfied ? 'Precondition satisfied' : this.failureMessage
      };
    } catch (err) {
      return {
        id: this.id,
        ruleName: this.ruleName,
        satisfied: false,
        message: `Evaluation error: ${err.message}`
      };
    }
  }

  static validateAll(preconditions, transformation, semanticGraph) {
    const results = [];
    let allPassed = true;
    for (const prec of preconditions) {
      const res = prec.evaluate(transformation, semanticGraph);
      results.push(res);
      if (!res.satisfied) allPassed = false;
    }
    return { allPassed, results };
  }
}
