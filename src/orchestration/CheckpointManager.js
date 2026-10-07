import { ExecutionCheckpoint } from './ExecutionCheckpoint.js';

export class CheckpointManager {
  constructor() {
    this.checkpoints = new Map(); // checkpointId -> ExecutionCheckpoint
    this.latestCheckpointId = null;
  }

  saveCheckpoint(state = {}) {
    const cp = new ExecutionCheckpoint(state);
    this.checkpoints.set(cp.checkpointId, cp);
    this.latestCheckpointId = cp.checkpointId;
    return cp;
  }

  getCheckpoint(checkpointId) {
    return this.checkpoints.get(String(checkpointId)) || null;
  }

  getLatestCheckpoint() {
    if (!this.latestCheckpointId) return null;
    return this.getCheckpoint(this.latestCheckpointId);
  }

  getAllCheckpoints() {
    return Array.from(this.checkpoints.values());
  }

  clear() {
    this.checkpoints.clear();
    this.latestCheckpointId = null;
  }
}
