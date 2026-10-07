/**
 * TemporalProperty.js
 * Represents a temporal verification specification.
 */

import { TemporalPropertyKind } from './TemporalPropertyKind.js';

export class TemporalProperty {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {string} [options.kind=TemporalPropertyKind.ALWAYS]
   * @param {Function|string} [options.predicate=null] Condition for atomic or unary property
   * @param {Function|string} [options.responsePredicate=null] Condition for response target
   * @param {number|null} [options.timeBound=null] Upper time/step bound
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name = '',
    kind = TemporalPropertyKind.ALWAYS,
    predicate = null,
    responsePredicate = null,
    timeBound = null,
    metadata = {}
  }) {
    if (!id) throw new Error('TemporalProperty requires id');
    this.id = id;
    this.name = name || id;
    this.kind = kind;
    this.predicate = predicate;
    this.responsePredicate = responsePredicate;
    this.timeBound = timeBound;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      kind: this.kind,
      predicate: typeof this.predicate === 'function' ? this.predicate.toString() : this.predicate,
      responsePredicate: typeof this.responsePredicate === 'function' ? this.responsePredicate.toString() : this.responsePredicate,
      timeBound: this.timeBound,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new TemporalProperty(json);
  }
}
