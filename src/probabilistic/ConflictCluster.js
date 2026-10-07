export class ConflictCluster {
  constructor({
    id,
    subject,
    classification = 'OBSERVATION_CONFLICT',
    evidenceItems = [],
    explanation = ''
  }) {
    this.id = id || `cluster:${subject}:${classification}:${Date.now()}`;
    this.subject = subject;
    this.classification = classification;
    this.evidenceItems = Object.freeze([...evidenceItems]);
    this.explanation = explanation;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      subject: this.subject,
      classification: this.classification,
      evidenceCount: this.evidenceItems.length,
      explanation: this.explanation
    };
  }
}
