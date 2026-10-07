export class ExecutionConflict {
  constructor({
    subject,
    evidenceA,
    evidenceB,
    conflictType = 'POLARITY_MISMATCH',
    resolution = null
  } = {}) {
    this.subject = String(subject);
    this.evidenceA = evidenceA;
    this.evidenceB = evidenceB;
    this.conflictType = conflictType;
    this.resolution = resolution;
    Object.freeze(this);
  }

  toJSON() {
    return {
      subject: this.subject,
      conflictType: this.conflictType,
      resolution: this.resolution
    };
  }
}
