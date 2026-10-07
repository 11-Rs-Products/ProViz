/**
 * CapabilityDependency.js
 * Expresses prerequisite capabilities required before executing a given capability.
 */

export class CapabilityDependency {
  /**
   * @param {Object} options
   * @param {string} options.sourceCapability - Target capability kind
   * @param {string} options.dependsOn - Prerequisite capability kind
   * @param {boolean} [options.isOptional=false]
   */
  constructor({
    sourceCapability,
    dependsOn,
    isOptional = false
  }) {
    if (!sourceCapability || !dependsOn) {
      throw new Error('CapabilityDependency requires sourceCapability and dependsOn');
    }
    this.sourceCapability = sourceCapability;
    this.dependsOn = dependsOn;
    this.isOptional = Boolean(isOptional);
    Object.freeze(this);
  }

  toJSON() {
    return {
      sourceCapability: this.sourceCapability,
      dependsOn: this.dependsOn,
      isOptional: this.isOptional
    };
  }

  static fromJSON(json) {
    return new CapabilityDependency(json);
  }
}
