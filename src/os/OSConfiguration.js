/**
 * OSConfiguration.js
 * Master runtime configuration parameters and safety thresholds for ProViz OS.
 */

import { OSMode } from './OSMode.js';

export class OSConfiguration {
  /**
   * @param {Object} [options]
   * @param {string} [options.mode=OSMode.AUTONOMOUS]
   * @param {string} [options.autonomyLevel='LEVEL_3_AUTO_REPAIR']
   * @param {number} [options.maxContinuousQueueSize=1000]
   * @param {number} [options.verificationTimeoutMs=30000]
   * @param {boolean} [options.enableAutoRollback=true]
   * @param {boolean} [options.requireHumanApprovalForCritical=true]
   * @param {boolean} [options.persistEventJournal=true]
   * @param {Object} [options.resourceQuotas={}]
   */
  constructor({
    mode = OSMode.AUTONOMOUS,
    autonomyLevel = 'LEVEL_3_AUTO_REPAIR',
    maxContinuousQueueSize = 1000,
    verificationTimeoutMs = 30000,
    enableAutoRollback = true,
    requireHumanApprovalForCritical = true,
    persistEventJournal = true,
    resourceQuotas = {}
  } = {}) {
    this.mode = mode;
    this.autonomyLevel = autonomyLevel;
    this.maxContinuousQueueSize = maxContinuousQueueSize;
    this.verificationTimeoutMs = verificationTimeoutMs;
    this.enableAutoRollback = Boolean(enableAutoRollback);
    this.requireHumanApprovalForCritical = Boolean(requireHumanApprovalForCritical);
    this.persistEventJournal = Boolean(persistEventJournal);
    this.resourceQuotas = Object.freeze({ ...resourceQuotas });
    Object.freeze(this);
  }

  toJSON() {
    return {
      mode: this.mode,
      autonomyLevel: this.autonomyLevel,
      maxContinuousQueueSize: this.maxContinuousQueueSize,
      verificationTimeoutMs: this.verificationTimeoutMs,
      enableAutoRollback: this.enableAutoRollback,
      requireHumanApprovalForCritical: this.requireHumanApprovalForCritical,
      persistEventJournal: this.persistEventJournal,
      resourceQuotas: this.resourceQuotas
    };
  }

  static fromJSON(json) {
    return new OSConfiguration(json);
  }
}
