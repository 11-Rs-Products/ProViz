/**
 * AutonomyPolicySet.js
 * Versioned set of autonomy policies.
 */

import { AutonomyPolicy } from './AutonomyPolicy.js';

export class AutonomyPolicySet {
  /**
   * @param {Object} [options]
   * @param {string} [options.id='default_autonomy_set']
   * @param {string} [options.version='1.0.0']
   * @param {AutonomyPolicy[]} [options.policies=[]]
   */
  constructor({
    id = 'default_autonomy_set',
    version = '1.0.0',
    policies = []
  } = {}) {
    this.id = id;
    this.version = version;
    this.policies = new Map();
    for (const p of policies) {
      const pol = p instanceof AutonomyPolicy ? p : new AutonomyPolicy(p);
      this.policies.set(pol.operation, pol);
    }
  }

  addPolicy(policyData) {
    const pol = policyData instanceof AutonomyPolicy ? policyData : new AutonomyPolicy(policyData);
    this.policies.set(pol.operation, pol);
    return pol;
  }

  getPolicyForOperation(operation) {
    return this.policies.get(operation) || null;
  }

  getPolicies() {
    return Array.from(this.policies.values());
  }

  toJSON() {
    return {
      id: this.id,
      version: this.version,
      policies: Array.from(this.policies.values()).map(p => p.toJSON())
    };
  }

  static fromJSON(json) {
    return new AutonomyPolicySet({
      id: json.id,
      version: json.version,
      policies: (json.policies || []).map(p => AutonomyPolicy.fromJSON(p))
    });
  }
}
