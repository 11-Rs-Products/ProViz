export class VerificationFact {
  constructor({
    id,
    subject,
    fact,
    confidence = 0.5,
    sources = [],
    timestamp = Date.now(),
    metadata = {}
  }) {
    this.id = id || `fact_${String(subject)}_${Date.now()}`;
    this.subject = String(subject);
    this.fact = String(fact);
    this.confidence = Number(confidence);
    this.sources = Object.freeze([...sources]);
    this.timestamp = timestamp;
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      subject: this.subject,
      fact: this.fact,
      confidence: this.confidence,
      sources: this.sources,
      timestamp: this.timestamp,
      metadata: this.metadata
    };
  }
}
