/**
 * SecurityInvariant.js
 * Formal security invariants that must remain inviolable across all executions.
 */

import { SecurityPropertyKind } from './SecurityPropertyKind.js';

export class SecurityInvariant {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.property - SecurityPropertyKind
   * @param {string} options.expression - Logical/Formal invariant expression
   * @param {string} [options.scope='GLOBAL']
   * @param {Array<string>} [options.protectedAssets=[]]
   * @param {string} [options.severity='HIGH']
   * @param {Function} [options.predicate=null] - Optional programmatic predicate
   */
  constructor({
    id,
    property = SecurityPropertyKind.INTEGRITY,
    expression,
    scope = 'GLOBAL',
    protectedAssets = [],
    severity = 'HIGH',
    predicate = null
  }) {
    if (!id || !expression) throw new Error('SecurityInvariant requires id and expression');
    this.id = id;
    this.property = property;
    this.expression = expression;
    this.scope = scope;
    this.protectedAssets = Object.freeze([...protectedAssets]);
    this.severity = severity;
    this._predicate = predicate;
    Object.freeze(this);
  }

  evaluates(stateContext) {
    if (typeof this._predicate === 'function') {
      try {
        return Boolean(this._predicate(stateContext));
      } catch {
        return false;
      }
    }
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      property: this.property,
      expression: this.expression,
      scope: this.scope,
      protectedAssets: [...this.protectedAssets],
      severity: this.severity
    };
  }

  static fromJSON(json) {
    return new SecurityInvariant(json);
  }
}
