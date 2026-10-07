/**
 * AutonomyPolicy.js
 * Rule governing autonomous execution permission for specific operations.
 */

import { AutonomyPolicyLevel } from './AutonomyPolicyLevel.js';

export class AutonomyPolicy {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.operation - e.g. 'AUTO_REPAIR', 'SECURITY_MITIGATION', 'API_CHANGE'
   * @param {string} [options.minAutonomyLevel=AutonomyPolicyLevel.LEVEL_3_AUTO_REPAIR]
   * @param {boolean} [options.requiresHumanApproval=false]
   * @param {string} [options.maxPermittedRisk='MEDIUM'] - 'LOW' | 'MEDIUM' | 'HIGH'
   */
  constructor({
    id,
    operation,
    minAutonomyLevel = AutonomyPolicyLevel.LEVEL_3_AUTO_REPAIR,
    requiresHumanApproval = false,
    maxPermittedRisk = 'MEDIUM'
  }) {
    if (!id || !operation) throw new Error('AutonomyPolicy requires id and operation');
    this.id = id;
    this.operation = operation;
    this.minAutonomyLevel = minAutonomyLevel;
    this.requiresHumanApproval = Boolean(requiresHumanApproval);
    this.maxPermittedRisk = maxPermittedRisk;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      operation: this.operation,
      minAutonomyLevel: this.minAutonomyLevel,
      requiresHumanApproval: this.requiresHumanApproval,
      maxPermittedRisk: this.maxPermittedRisk
    };
  }

  static fromJSON(json) {
    return new AutonomyPolicy(json);
  }
}
