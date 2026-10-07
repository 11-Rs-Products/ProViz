/**
 * ArchitectureDrift.js
 * Represents structural and behavioral drift between an architecture baseline and the current state.
 */

export const DriftSeverity = Object.freeze({
  NONE: 'NONE',
  MINOR: 'MINOR',
  MODERATE: 'MODERATE',
  MAJOR: 'MAJOR',
  CRITICAL: 'CRITICAL'
});

export class ArchitectureDrift {
  /**
   * @param {Object} options
   * @param {string} options.baselineId
   * @param {string} options.severity - 'NONE' | 'MINOR' | 'MODERATE' | 'MAJOR' | 'CRITICAL'
   * @param {string[]} [options.addedDependencies=[]]
   * @param {string[]} [options.removedDependencies=[]]
   * @param {string[]} [options.newViolations=[]]
   * @param {Object} [options.structuralDiff={}]
   * @param {Object} [options.provenance={}]
   * @param {number} [options.timestamp]
   */
  constructor({
    baselineId,
    severity = DriftSeverity.NONE,
    addedDependencies = [],
    removedDependencies = [],
    newViolations = [],
    structuralDiff = {},
    provenance = {},
    timestamp = Date.now()
  }) {
    if (!baselineId) throw new Error('ArchitectureDrift requires baselineId');
    this.baselineId = baselineId;
    this.severity = severity;
    this.addedDependencies = Object.freeze([...addedDependencies]);
    this.removedDependencies = Object.freeze([...removedDependencies]);
    this.newViolations = Object.freeze([...newViolations]);
    this.structuralDiff = Object.freeze({ ...structuralDiff });
    this.provenance = Object.freeze({ ...provenance });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  get hasDrift() {
    return this.severity !== DriftSeverity.NONE;
  }

  toJSON() {
    return {
      baselineId: this.baselineId,
      severity: this.severity,
      addedDependencies: [...this.addedDependencies],
      removedDependencies: [...this.removedDependencies],
      newViolations: [...this.newViolations],
      structuralDiff: { ...this.structuralDiff },
      provenance: { ...this.provenance },
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new ArchitectureDrift(json);
  }
}
