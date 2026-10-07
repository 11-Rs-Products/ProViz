/**
 * ArchitectureConstraint.js
 * Formal constraint on dependency patterns, layers, coupling, or boundaries.
 */

export const ArchitectureConstraintKind = Object.freeze({
  FORBID_DEPENDENCY: 'FORBID_DEPENDENCY',
  REQUIRE_DEPENDENCY: 'REQUIRE_DEPENDENCY',
  LAYER_HIERARCHY: 'LAYER_HIERARCHY',
  BOUNDARY_ENCAPSULATION: 'BOUNDARY_ENCAPSULATION',
  MAX_FAN_OUT: 'MAX_FAN_OUT',
  MAX_COUPLING: 'MAX_COUPLING',
  NO_CYCLES: 'NO_CYCLES'
});

export class ArchitectureConstraint {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.kind
   * @param {Object} [options.params={}]
   * @param {string} [options.severity='ERROR'] - 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
   * @param {string} [options.description='']
   */
  constructor({
    id,
    kind,
    params = {},
    severity = 'ERROR',
    description = ''
  }) {
    if (!id || !kind) throw new Error('ArchitectureConstraint requires id and kind');
    this.id = id;
    this.kind = kind;
    this.params = Object.freeze({ ...params });
    this.severity = severity;
    this.description = description;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      params: { ...this.params },
      severity: this.severity,
      description: this.description
    };
  }

  static fromJSON(json) {
    return new ArchitectureConstraint(json);
  }
}
