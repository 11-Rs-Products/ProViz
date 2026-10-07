export class ConditionalBehavior {
  constructor({ subject, partitions = [] }) {
    this.subject = subject;
    this.partitions = Object.freeze([...partitions]); // Array of PartitionEvidence
    Object.freeze(this);
  }

  getPartitionFor(inputContext) {
    for (const pe of this.partitions) {
      if (pe.partition.evaluates(inputContext)) {
        return pe;
      }
    }
    return null;
  }

  getDistributionFor(inputContext) {
    const pe = this.getPartitionFor(inputContext);
    return pe ? pe.distribution : null;
  }

  getPartitionById(partitionId) {
    return this.partitions.find(p => p.partition.id === partitionId) || null;
  }

  toJSON() {
    return {
      subject: this.subject,
      partitions: this.partitions.map(p => p.toJSON())
    };
  }
}
