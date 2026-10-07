/**
 * UnifiedProjectState.js
 * Canonical immutable project state unifying all domain states across Stages 1–35.
 */

import { StateRevision } from './StateRevision.js';

export class UnifiedProjectState {
  /**
   * @param {Object} options
   * @param {string} options.projectId
   * @param {StateRevision} [options.revision]
   * @param {Object} [options.projectModel]
   * @param {Object} [options.runtimeState]
   * @param {Object} [options.semanticState]
   * @param {Object} [options.knowledgeState]
   * @param {Object} [options.verificationState]
   * @param {Object} [options.securityState]
   * @param {Object} [options.performanceState]
   * @param {Object} [options.concurrencyState]
   * @param {Object} [options.evolutionState]
   * @param {Object} [options.projectIntelligenceState]
   * @param {Object} [options.governanceState]
   * @param {Object} [options.certificationState]
   * @param {Object} [options.metadata]
   * @param {number} [options.timestamp]
   */
  constructor({
    projectId,
    revision = new StateRevision({ sequenceNumber: 0 }),
    projectModel = null,
    runtimeState = {},
    semanticState = {},
    knowledgeState = {},
    verificationState = {},
    securityState = {},
    performanceState = {},
    concurrencyState = {},
    evolutionState = {},
    projectIntelligenceState = {},
    governanceState = {},
    certificationState = {},
    metadata = {},
    timestamp = Date.now()
  }) {
    if (!projectId) throw new Error('UnifiedProjectState requires projectId');
    this.projectId = projectId;
    this.revision = revision instanceof StateRevision ? revision : StateRevision.fromJSON(revision);
    this.projectModel = projectModel;
    this.runtimeState = Object.freeze({ ...runtimeState });
    this.semanticState = Object.freeze({ ...semanticState });
    this.knowledgeState = Object.freeze({ ...knowledgeState });
    this.verificationState = Object.freeze({ ...verificationState });
    this.securityState = Object.freeze({ ...securityState });
    this.performanceState = Object.freeze({ ...performanceState });
    this.concurrencyState = Object.freeze({ ...concurrencyState });
    this.evolutionState = Object.freeze({ ...evolutionState });
    this.projectIntelligenceState = Object.freeze({ ...projectIntelligenceState });
    this.governanceState = Object.freeze({ ...governanceState });
    this.certificationState = Object.freeze({ ...certificationState });
    this.metadata = Object.freeze({ ...metadata });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      projectId: this.projectId,
      revision: this.revision.toJSON(),
      projectModel: this.projectModel?.toJSON ? this.projectModel.toJSON() : this.projectModel,
      runtimeState: this.runtimeState,
      semanticState: this.semanticState,
      knowledgeState: this.knowledgeState,
      verificationState: this.verificationState,
      securityState: this.securityState,
      performanceState: this.performanceState,
      concurrencyState: this.concurrencyState,
      evolutionState: this.evolutionState,
      projectIntelligenceState: this.projectIntelligenceState,
      governanceState: this.governanceState,
      certificationState: this.certificationState,
      metadata: this.metadata,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new UnifiedProjectState(json);
  }
}
