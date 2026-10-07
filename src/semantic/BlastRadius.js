/**
 * BlastRadius.js
 * Categorizes and calculates the architectural and verification blast radius of a change.
 */

export const BlastRadiusScope = Object.freeze({
  LOCAL: 'LOCAL',
  FUNCTION: 'FUNCTION',
  MODULE: 'MODULE',
  PACKAGE: 'PACKAGE',
  PROJECT: 'PROJECT',
  SYSTEM: 'SYSTEM',
  EXTERNAL: 'EXTERNAL'
});

export const BlastRadiusSeverity = Object.freeze({
  TRIVIAL: 'TRIVIAL',
  LOW: 'LOW',
  MODERATE: 'MODERATE',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
});

export class BlastRadius {
  /**
   * @param {Object} options
   * @param {string} options.scope - BlastRadiusScope
   * @param {string} options.severity - BlastRadiusSeverity
   * @param {Array<string>} [options.affectedCallers=[]]
   * @param {Array<string>} [options.affectedTests=[]]
   * @param {Array<string>} [options.affectedContracts=[]]
   * @param {Array<string>} [options.affectedInvariants=[]]
   * @param {Array<string>} [options.affectedProofs=[]]
   * @param {Array<string>} [options.affectedMutants=[]]
   * @param {Array<string>} [options.affectedAPIs=[]]
   * @param {number} [options.totalAffectedEntities=0]
   */
  constructor({
    scope = BlastRadiusScope.LOCAL,
    severity = BlastRadiusSeverity.LOW,
    affectedCallers = [],
    affectedTests = [],
    affectedContracts = [],
    affectedInvariants = [],
    affectedProofs = [],
    affectedMutants = [],
    affectedAPIs = [],
    totalAffectedEntities = 0
  }) {
    this.scope = scope;
    this.severity = severity;
    this.affectedCallers = Object.freeze([...affectedCallers]);
    this.affectedTests = Object.freeze([...affectedTests]);
    this.affectedContracts = Object.freeze([...affectedContracts]);
    this.affectedInvariants = Object.freeze([...affectedInvariants]);
    this.affectedProofs = Object.freeze([...affectedProofs]);
    this.affectedMutants = Object.freeze([...affectedMutants]);
    this.affectedAPIs = Object.freeze([...affectedAPIs]);
    this.totalAffectedEntities = totalAffectedEntities || (
      this.affectedCallers.length +
      this.affectedTests.length +
      this.affectedContracts.length +
      this.affectedInvariants.length +
      this.affectedProofs.length +
      this.affectedMutants.length +
      this.affectedAPIs.length
    );

    Object.freeze(this);
  }

  toJSON() {
    return {
      scope: this.scope,
      severity: this.severity,
      affectedCallers: [...this.affectedCallers],
      affectedTests: [...this.affectedTests],
      affectedContracts: [...this.affectedContracts],
      affectedInvariants: [...this.affectedInvariants],
      affectedProofs: [...this.affectedProofs],
      affectedMutants: [...this.affectedMutants],
      affectedAPIs: [...this.affectedAPIs],
      totalAffectedEntities: this.totalAffectedEntities
    };
  }

  static fromJSON(json) {
    return new BlastRadius(json);
  }
}
