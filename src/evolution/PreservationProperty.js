/**
 * PreservationProperty.js
 * Formalized semantic and observable properties that must remain preserved under a transformation.
 */

export const PreservationPropertyKind = Object.freeze({
  RETURN_VALUES: 'RETURN_VALUES',
  EXCEPTIONS: 'EXCEPTIONS',
  SIDE_EFFECTS: 'SIDE_EFFECTS',
  HEAP_STATE: 'HEAP_STATE',
  IO: 'IO',
  CALL_ORDER: 'CALL_ORDER',
  OBSERVABLE_OUTPUT: 'OBSERVABLE_OUTPUT',
  API_SIGNATURE: 'API_SIGNATURE',
  CONTRACTS: 'CONTRACTS',
  INVARIANTS: 'INVARIANTS',
  SECURITY_PROPERTIES: 'SECURITY_PROPERTIES',
  RESOURCE_BEHAVIOR: 'RESOURCE_BEHAVIOR',
  TEMPORAL_PROPERTIES: 'TEMPORAL_PROPERTIES',
  CONCURRENCY_PROPERTIES: 'CONCURRENCY_PROPERTIES',
  TEST_ORACLES: 'TEST_ORACLES'
});

export class PreservationProperty {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.kind - PreservationPropertyKind
   * @param {string} [options.scope='GLOBAL']
   * @param {Object} [options.specification={}] - Formal constraint or predicate
   */
  constructor({
    id,
    kind = PreservationPropertyKind.OBSERVABLE_OUTPUT,
    scope = 'GLOBAL',
    specification = null
  }) {
    if (!id || typeof id !== 'string') {
      throw new Error('PreservationProperty requires a valid id');
    }

    this.id = id;
    this.kind = kind;
    this.scope = scope;
    this.specification = specification ? Object.freeze({ ...specification }) : Object.freeze({});

    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      scope: this.scope,
      specification: this.specification
    };
  }

  static fromJSON(json) {
    return new PreservationProperty(json);
  }
}
