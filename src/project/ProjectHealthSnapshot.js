/**
 * ProjectHealthSnapshot.js
 * Captures comprehensive health state across architecture, security, performance, reliability, concurrency, debt, and governance.
 * Invariant: Every snapshot is reproducible from source evidence.
 */

import { EngineeringHealth } from './EngineeringHealth.js';

export class ProjectHealthSnapshot {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.projectId
   * @param {number} options.revision
   * @param {EngineeringHealth} options.health
   * @param {Object} [options.architectureHealth={}]
   * @param {Object} [options.securityHealth={}]
   * @param {Object} [options.performanceHealth={}]
   * @param {Object} [options.reliabilityHealth={}]
   * @param {Object} [options.concurrencyHealth={}]
   * @param {Object} [options.debtSummary={}]
   * @param {Object} [options.governanceSummary={}]
   * @param {number} [options.timestamp]
   */
  constructor({
    id,
    projectId,
    revision,
    health,
    architectureHealth = {},
    securityHealth = {},
    performanceHealth = {},
    reliabilityHealth = {},
    concurrencyHealth = {},
    debtSummary = {},
    governanceSummary = {},
    timestamp = Date.now()
  }) {
    if (!id || !projectId || !health) throw new Error('ProjectHealthSnapshot requires id, projectId, and health');
    this.id = id;
    this.projectId = projectId;
    this.revision = revision;
    this.health = health instanceof EngineeringHealth ? health : new EngineeringHealth(health);
    this.architectureHealth = Object.freeze({ ...architectureHealth });
    this.securityHealth = Object.freeze({ ...securityHealth });
    this.performanceHealth = Object.freeze({ ...performanceHealth });
    this.reliabilityHealth = Object.freeze({ ...reliabilityHealth });
    this.concurrencyHealth = Object.freeze({ ...concurrencyHealth });
    this.debtSummary = Object.freeze({ ...debtSummary });
    this.governanceSummary = Object.freeze({ ...governanceSummary });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      projectId: this.projectId,
      revision: this.revision,
      health: this.health.toJSON(),
      architectureHealth: this.architectureHealth,
      securityHealth: this.securityHealth,
      performanceHealth: this.performanceHealth,
      reliabilityHealth: this.reliabilityHealth,
      concurrencyHealth: this.concurrencyHealth,
      debtSummary: this.debtSummary,
      governanceSummary: this.governanceSummary,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new ProjectHealthSnapshot({
      id: json.id,
      projectId: json.projectId,
      revision: json.revision,
      health: EngineeringHealth.fromJSON(json.health),
      architectureHealth: json.architectureHealth,
      securityHealth: json.securityHealth,
      performanceHealth: json.performanceHealth,
      reliabilityHealth: json.reliabilityHealth,
      concurrencyHealth: json.concurrencyHealth,
      debtSummary: json.debtSummary,
      governanceSummary: json.governanceSummary,
      timestamp: json.timestamp
    });
  }
}
