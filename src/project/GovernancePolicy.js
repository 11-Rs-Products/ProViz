/**
 * GovernancePolicy.js
 * Cohesive collection of governance rules representing a named organizational policy.
 */

import { GovernanceRule } from './GovernanceRule.js';

export class GovernancePolicy {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.name
   * @param {string} [options.version='1.0.0']
   * @param {GovernanceRule[]} [options.rules=[]]
   * @param {boolean} [options.enabled=true]
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    name,
    version = '1.0.0',
    rules = [],
    enabled = true,
    metadata = {}
  }) {
    if (!id || !name) throw new Error('GovernancePolicy requires id and name');
    this.id = id;
    this.name = name;
    this.version = version;
    this.rules = rules.map(r => r instanceof GovernanceRule ? r : new GovernanceRule(r));
    this.enabled = Boolean(enabled);
    this.metadata = { ...metadata };
  }

  addRule(ruleData) {
    const rule = ruleData instanceof GovernanceRule ? ruleData : new GovernanceRule(ruleData);
    this.rules.push(rule);
    return rule;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      rules: this.rules.map(r => r.toJSON()),
      enabled: this.enabled,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json) {
    return new GovernancePolicy({
      id: json.id,
      name: json.name,
      version: json.version,
      rules: (json.rules || []).map(r => GovernanceRule.fromJSON(r)),
      enabled: json.enabled,
      metadata: json.metadata
    });
  }
}
