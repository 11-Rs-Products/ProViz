import { BehaviorDistribution } from './BehaviorDistribution.js';
import { EvidenceSet } from './EvidenceSet.js';

export class PartitionEvidence {
  constructor({
    partition,
    distribution,
    evidenceSet = new EvidenceSet(),
    sampleCount = 0
  }) {
    this.partition = partition;
    this.distribution = distribution;
    this.evidenceSet = evidenceSet;
    this.sampleCount = sampleCount;
    Object.freeze(this);
  }

  toJSON() {
    return {
      partition: this.partition ? this.partition.toJSON() : null,
      distribution: this.distribution ? this.distribution.toJSON() : null,
      evidenceCount: this.evidenceSet.size,
      sampleCount: this.sampleCount
    };
  }
}
