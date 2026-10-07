/**
 * Deterministic immutable snapshot of federation state
 */
export class FederationSnapshot {
  constructor({
    snapshotId,
    timestamp = Date.now(),
    federation,
    tasks = [],
    evidence = [],
    conflicts = [],
    decisions = [],
    health = []
  } = {}) {
    this.snapshotId = snapshotId || `fed-snap-${Math.random().toString(36).slice(2, 9)}`;
    this.timestamp = timestamp;
    this.federation = federation;
    this.tasks = Object.freeze([...tasks]);
    this.evidence = Object.freeze([...evidence]);
    this.conflicts = Object.freeze([...conflicts]);
    this.decisions = Object.freeze([...decisions]);
    this.health = Object.freeze([...health]);
    Object.freeze(this);
  }

  toJSON() {
    return {
      snapshotId: this.snapshotId,
      timestamp: this.timestamp,
      federation: this.federation,
      tasks: this.tasks,
      evidence: this.evidence,
      conflicts: this.conflicts,
      decisions: this.decisions,
      health: this.health
    };
  }

  static fromJSON(json = {}) {
    return new FederationSnapshot(json);
  }
}
