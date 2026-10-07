/**
 * SecurityCounterexample.js
 * Structured security counterexample capturing entry, input payload, path, state transitions,
 * violated property, sensitive asset, sink, and evidence.
 */

export class SecurityCounterexample {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.entryNodeId
   * @param {*} options.adversarialInput
   * @param {Array<string>} [options.path=[]]
   * @param {string} options.violatedProperty
   * @param {string} [options.sensitiveAssetId='']
   * @param {string} [options.sensitiveSinkId='']
   * @param {Array<string>} [options.stateTransitions=[]]
   * @param {string} [options.evidenceSummary='']
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    entryNodeId,
    adversarialInput,
    path = [],
    violatedProperty,
    sensitiveAssetId = '',
    sensitiveSinkId = '',
    stateTransitions = [],
    evidenceSummary = '',
    metadata = {}
  }) {
    if (!id || !entryNodeId || !violatedProperty) {
      throw new Error('SecurityCounterexample requires id, entryNodeId, and violatedProperty');
    }
    this.id = id;
    this.entryNodeId = entryNodeId;
    this.adversarialInput = adversarialInput;
    this.path = Object.freeze([...path]);
    this.violatedProperty = violatedProperty;
    this.sensitiveAssetId = sensitiveAssetId;
    this.sensitiveSinkId = sensitiveSinkId;
    this.stateTransitions = Object.freeze([...stateTransitions]);
    this.evidenceSummary = evidenceSummary || `Counterexample violating ${violatedProperty}`;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      entryNodeId: this.entryNodeId,
      adversarialInput: this.adversarialInput,
      path: [...this.path],
      violatedProperty: this.violatedProperty,
      sensitiveAssetId: this.sensitiveAssetId,
      sensitiveSinkId: this.sensitiveSinkId,
      stateTransitions: [...this.stateTransitions],
      evidenceSummary: this.evidenceSummary,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new SecurityCounterexample(json);
  }
}
