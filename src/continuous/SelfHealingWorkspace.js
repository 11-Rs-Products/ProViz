/**
 * SelfHealingWorkspace.js
 * Isolated sandbox workspace for staging, applying, verifying, and committing/reverting candidate repairs.
 */

import { VerificationRollbackManager } from './VerificationRollbackManager.js';
import { RepairSafetyGate } from './RepairSafetyGate.js';
import { RepairHistory } from './RepairHistory.js';

export class SelfHealingWorkspace {
  /**
   * @param {Object} [options={}]
   * @param {VerificationRollbackManager} [options.rollbackManager]
   * @param {RepairSafetyGate} [options.safetyGate]
   * @param {RepairHistory} [options.repairHistory]
   */
  constructor({
    rollbackManager = new VerificationRollbackManager(),
    safetyGate = new RepairSafetyGate(),
    repairHistory = new RepairHistory()
  } = {}) {
    this.rollbackManager = rollbackManager;
    this.safetyGate = safetyGate;
    this.repairHistory = repairHistory;
    this.stagedFiles = new Map();
    this.activeCheckpoint = null;
  }

  /**
   * Initializes staging workspace from canonical files.
   * @param {string} revision
   * @param {Map<string, string>|Object} files
   */
  initialize(revision, files) {
    const fileMap = files instanceof Map ? files : new Map(Object.entries(files));
    this.stagedFiles = new Map(fileMap);
    this.activeCheckpoint = this.rollbackManager.createCheckpoint(
      `cp-pre-repair-${Date.now()}`,
      revision,
      fileMap,
      { label: 'Pre-repair baseline' }
    );
    return this.activeCheckpoint;
  }

  /**
   * Stages a candidate repair in the isolated environment.
   * @param {Object} repairCandidate
   * @param {Object} patch Map of filePath -> newContent
   */
  stageRepair(repairCandidate, patch = {}) {
    const patchEntries = patch instanceof Map ? patch.entries() : Object.entries(patch);
    for (const [path, content] of patchEntries) {
      this.stagedFiles.set(path, content);
    }
    return { staged: true, repairId: repairCandidate.id };
  }

  /**
   * Validates staged repair against safety gates and commits or rolls back.
   * @param {Object} repairCandidate
   * @param {Object} validationResults
   * @returns {{ accepted: boolean, safetyResult: Object, record: Object }}
   */
  commitOrRollback(repairCandidate, validationResults = {}) {
    const safetyResult = this.safetyGate.evaluateSafety(repairCandidate, validationResults);

    if (safetyResult.passed) {
      const record = this.repairHistory.recordRepair({
        repairId: repairCandidate.id,
        targetEntity: repairCandidate.targetEntity,
        patch: repairCandidate.patch || {},
        reason: repairCandidate.description,
        checkpointId: this.activeCheckpoint ? this.activeCheckpoint.id : null,
        validationResults,
        status: 'APPLIED',
        decision: 'ACCEPTED'
      });
      return { accepted: true, safetyResult, record, files: new Map(this.stagedFiles) };
    } else {
      // Revert staged files back to active checkpoint
      if (this.activeCheckpoint) {
        this.stagedFiles = new Map(this.activeCheckpoint.files);
      }
      const record = this.repairHistory.recordRepair({
        repairId: repairCandidate.id,
        targetEntity: repairCandidate.targetEntity,
        patch: repairCandidate.patch || {},
        reason: repairCandidate.description,
        checkpointId: this.activeCheckpoint ? this.activeCheckpoint.id : null,
        validationResults,
        status: 'REJECTED_ROLLED_BACK',
        decision: 'REJECTED'
      });
      return { accepted: false, safetyResult, record, files: new Map(this.stagedFiles) };
    }
  }
}
