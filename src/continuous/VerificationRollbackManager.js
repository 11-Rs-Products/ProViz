/**
 * VerificationRollbackManager.js
 * Manages checkpoint capture, state restoration, rollback, and replay.
 */

import { VerificationCheckpoint } from './VerificationCheckpoint.js';

export class VerificationRollbackManager {
  constructor() {
    /** @type {Map<string, VerificationCheckpoint>} */
    this.checkpoints = new Map();
  }

  createCheckpoint(id, revision, files, metadata = {}) {
    const cp = new VerificationCheckpoint({ id, revision, files, metadata });
    this.checkpoints.set(id, cp);
    return cp;
  }

  getCheckpoint(id) {
    return this.checkpoints.get(id) || null;
  }

  rollback(checkpointId) {
    const cp = this.getCheckpoint(checkpointId);
    if (!cp) {
      return { success: false, reason: `Checkpoint '${checkpointId}' not found.` };
    }
    return {
      success: true,
      restoredCheckpoint: cp,
      files: new Map(cp.files)
    };
  }

  listCheckpoints() {
    return Array.from(this.checkpoints.values());
  }
}
