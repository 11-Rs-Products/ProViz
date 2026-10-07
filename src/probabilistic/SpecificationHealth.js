export class SpecificationHealth {
  constructor({
    totalSpecifications = 0,
    verifiedCount = 0,
    uncertainCount = 0,
    conflictingCount = 0,
    violatedCount = 0
  }) {
    this.totalSpecifications = totalSpecifications;
    this.verifiedCount = verifiedCount;
    this.uncertainCount = uncertainCount;
    this.conflictingCount = conflictingCount;
    this.violatedCount = violatedCount;
    Object.freeze(this);
  }

  toJSON() {
    return {
      totalSpecifications: this.totalSpecifications,
      verifiedCount: this.verifiedCount,
      uncertainCount: this.uncertainCount,
      conflictingCount: this.conflictingCount,
      violatedCount: this.violatedCount
    };
  }
}
