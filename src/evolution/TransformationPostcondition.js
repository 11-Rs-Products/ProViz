/**
 * TransformationPostcondition.js
 * Asserts expected properties and invariants on the transformed semantic state.
 */

export class TransformationPostcondition {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.assertionName
   * @param {Function} [options.assertionFn] - (transformation, beforeGraph, afterGraph) => boolean
   * @param {string} [options.failureMessage='']
   */
  constructor({
    id,
    assertionName,
    assertionFn = null,
    failureMessage = ''
  }) {
    if (!id || !assertionName) {
      throw new Error('TransformationPostcondition requires id and assertionName');
    }

    this.id = id;
    this.assertionName = assertionName;
    this.assertionFn = assertionFn || (() => true);
    this.failureMessage = failureMessage || `Postcondition '${assertionName}' failed`;

    Object.freeze(this);
  }

  evaluate(transformation, beforeGraph, afterGraph) {
    try {
      const satisfied = Boolean(this.assertionFn(transformation, beforeGraph, afterGraph));
      return {
        id: this.id,
        assertionName: this.assertionName,
        satisfied,
        message: satisfied ? 'Postcondition verified' : this.failureMessage
      };
    } catch (err) {
      return {
        id: this.id,
        assertionName: this.assertionName,
        satisfied: false,
        message: `Evaluation error: ${err.message}`
      };
    }
  }

  static validateAll(postconditions, transformation, beforeGraph, afterGraph) {
    const results = [];
    let allPassed = true;
    for (const post of postconditions) {
      const res = post.evaluate(transformation, beforeGraph, afterGraph);
      results.push(res);
      if (!res.satisfied) allPassed = false;
    }
    return { allPassed, results };
  }
}
