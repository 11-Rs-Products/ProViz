import { ConditionPartition } from './ConditionPartition.js';
import { PartitionEvidence } from './PartitionEvidence.js';
import { BehaviorModelBuilder } from './BehaviorModelBuilder.js';
import { ConditionalBehavior } from './ConditionalBehavior.js';
import { EvidenceSet } from './EvidenceSet.js';

export class BehaviorPartitioner {
  constructor(subject) {
    this.subject = subject;
    this.partitions = []; // Array of ConditionPartition
    this.builders = new Map(); // partitionId -> BehaviorModelBuilder
    this.evidenceSets = new Map(); // partitionId -> EvidenceSet
  }

  addPartition(partition) {
    if (!this.partitions.some(p => p.id === partition.id)) {
      this.partitions.push(partition);
      this.builders.set(partition.id, new BehaviorModelBuilder(this.subject, partition.id));
      this.evidenceSets.set(partition.id, new EvidenceSet());
    }
    return this;
  }

  recordObservation(inputContext, outcome, evidence = null) {
    for (const p of this.partitions) {
      if (p.evaluates(inputContext)) {
        const builder = this.builders.get(p.id);
        builder.addObservation(outcome, evidence);
        if (evidence) {
          const currentEv = this.evidenceSets.get(p.id);
          this.evidenceSets.set(p.id, currentEv.add(evidence));
        }
      }
    }
    return this;
  }

  build() {
    const partitionEvidences = [];
    for (const p of this.partitions) {
      const builder = this.builders.get(p.id);
      const dist = builder ? builder.build() : null;
      const evSet = this.evidenceSets.get(p.id) || new EvidenceSet();
      partitionEvidences.push(
        new PartitionEvidence({
          partition: p,
          distribution: dist,
          evidenceSet: evSet,
          sampleCount: dist ? dist.totalObservations : 0
        })
      );
    }

    return new ConditionalBehavior({
      subject: this.subject,
      partitions: partitionEvidences
    });
  }
}
