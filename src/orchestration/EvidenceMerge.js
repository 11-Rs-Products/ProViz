import { EvidenceMergePolicy } from './EvidenceMergePolicy.js';

export class EvidenceMerge {
  constructor({
    mergedEvidence = [],
    conflicts = [],
    policy = EvidenceMergePolicy.PRESERVE_CONFLICT,
    timestamp = Date.now()
  } = {}) {
    this.mergedEvidence = Object.freeze([...mergedEvidence]);
    this.conflicts = Object.freeze([...conflicts]);
    this.policy = policy;
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      mergedEvidenceCount: this.mergedEvidence.length,
      conflictsCount: this.conflicts.length,
      conflicts: this.conflicts,
      policy: this.policy,
      timestamp: this.timestamp
    };
  }
}
