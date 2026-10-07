/**
 * GovernancePolicySet.js
 * Versioned container of active GovernancePolicies applied to the project.
 */

import { GovernancePolicy } from './GovernancePolicy.js';

export class GovernancePolicySet {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} [options.name='']
   * @param {string} [options.version='1.0.0']
   * @param {GovernancePolicy[]} [options.policies=[]]
   */
  constructor({
    id,
    name = '',
    version = '1.0.0',
    policies = []
  }) {
    if (!id) throw new Error('GovernancePolicySet requires id');
    this.id = id;
    this.name = name || id;
    this.version = version;
    this.policies = new Map();
    for (const p of policies) {
      const policy = p instanceof GovernancePolicy ? p : new GovernancePolicy(p);
      this.policies.set(policy.id, policy);
    }
  }

  addPolicy(policyData) {
    const policy = policyData instanceof GovernancePolicy ? policyData : new GovernancePolicy(policyData);
    this.policies.set(policy.id, policy);
    return policy;
  }

  getPolicy(id) {
    return this.policies.get(id) || null;
  }

  getPolicies() {
    return Array.from(this.policies.values());
  }

  getAllRules() {
    const rules = [];
    for (const policy of this.policies.values()) {
      if (policy.enabled) {
        rules.push(...policy.rules.filter(r => r.enabled));
      }
    }
    return rules;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      policies: Array.from(this.policies.values()).map(p => p.toJSON())
    };
  }

  static fromJSON(json) {
    return new GovernancePolicySet({
      id: json.id,
      name: json.name,
      version: json.version,
      policies: (json.policies || []).map(p => GovernancePolicy.fromJSON(p))
    });
  }
}
