import { ExplorationStatus } from './ExplorationStatus.js';
import { ExplorationSnapshot } from './ExplorationSnapshot.js';

export class ExplorationSession {
  constructor({ id, campaign, budget, policy, metadata = {} } = {}) {
    this.id = id || `session_${Math.random().toString(36).substring(2, 9)}`;
    this.campaign = campaign || null;
    this.budget = budget || null;
    this.policy = policy || null;
    this.status = ExplorationStatus.PENDING || 'PENDING';
    this.history = [];
    this.snapshots = [];
    this.metadata = metadata;
    this.startTime = null;
    this.endTime = null;
  }

  start() {
    this.status = ExplorationStatus.RUNNING || 'RUNNING';
    this.startTime = Date.now();
    this.takeSnapshot('session_start');
  }

  pause() {
    this.status = ExplorationStatus.PAUSED || 'PAUSED';
    this.takeSnapshot('session_paused');
  }

  resume() {
    this.status = ExplorationStatus.RUNNING || 'RUNNING';
    this.takeSnapshot('session_resumed');
  }

  complete() {
    this.status = ExplorationStatus.COMPLETED || 'COMPLETED';
    this.endTime = Date.now();
    this.takeSnapshot('session_completed');
  }

  cancel(reason = 'User cancelled') {
    this.status = ExplorationStatus.CANCELLED || 'CANCELLED';
    this.endTime = Date.now();
    this.metadata.cancellationReason = reason;
    this.takeSnapshot('session_cancelled');
  }

  takeSnapshot(label = '') {
    const snap = new ExplorationSnapshot({
      id: `exp_snap_${this.snapshots.length + 1}`,
      sessionId: this.id,
      timestamp: Date.now(),
      label,
      status: this.status,
      candidatesCount: this.campaign ? (this.campaign.candidates?.length || 0) : 0,
      findingsCount: this.campaign ? (this.campaign.findings?.length || 0) : 0
    });
    this.snapshots.push(snap);
    return snap;
  }

  toJSON() {
    return {
      id: this.id,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      snapshotsCount: this.snapshots.length,
      metadata: this.metadata
    };
  }
}
