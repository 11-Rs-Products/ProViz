/**
 * AdversarialInput.js
 * Represents structured adversarial payloads designed to trigger unexpected behavior or security violations.
 */

export const AdversarialInputCategory = Object.freeze({
  BOUNDARY: 'BOUNDARY',
  MALFORMED: 'MALFORMED',
  EMPTY: 'EMPTY',
  EXTREME: 'EXTREME',
  AMBIGUOUS: 'AMBIGUOUS',
  CONFLICTING: 'CONFLICTING',
  STRUCTURALLY_INVALID: 'STRUCTURALLY_INVALID',
  SEMANTICALLY_INVALID: 'SEMANTICALLY_INVALID',
  RESOURCE_EXPENSIVE: 'RESOURCE_EXPENSIVE'
});

export class AdversarialInput {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.category - AdversarialInputCategory
   * @param {string} options.targetParam
   * @param {*} options.payload
   * @param {string} [options.expectedFailureType='']
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    category = AdversarialInputCategory.BOUNDARY,
    targetParam,
    payload,
    expectedFailureType = '',
    metadata = {}
  }) {
    if (!id || !targetParam) throw new Error('AdversarialInput requires id and targetParam');
    this.id = id;
    this.category = category;
    this.targetParam = targetParam;
    this.payload = payload;
    this.expectedFailureType = expectedFailureType;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      category: this.category,
      targetParam: this.targetParam,
      payload: this.payload,
      expectedFailureType: this.expectedFailureType,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new AdversarialInput(json);
  }
}
