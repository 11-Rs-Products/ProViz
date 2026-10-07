/**
 * ConsistencyModel.js
 * Supported distributed consistency models.
 */

export const ConsistencyKind = Object.freeze({
  LINEARIZABLE: 'LINEARIZABLE',
  SEQUENTIAL: 'SEQUENTIAL',
  CAUSAL: 'CAUSAL',
  EVENTUAL: 'EVENTUAL',
  READ_YOUR_WRITES: 'READ_YOUR_WRITES',
  MONOTONIC_READS: 'MONOTONIC_READS',
  MONOTONIC_WRITES: 'MONOTONIC_WRITES'
});

export class ConsistencyModel {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {string} [options.kind=ConsistencyKind.EVENTUAL]
   * @param {Object} [options.parameters={}]
   */
  constructor({
    id,
    name = '',
    kind = ConsistencyKind.EVENTUAL,
    parameters = {}
  }) {
    if (!id) throw new Error('ConsistencyModel requires id');
    this.id = id;
    this.name = name || id;
    this.kind = kind;
    this.parameters = Object.freeze({ ...parameters });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
      parameters: { ...this.parameters }
    };
  }
}
