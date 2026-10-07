export class RareBehavior {
  constructor({
    id,
    subject,
    outcome,
    frequency = 0,
    probability = 0.0,
    firstSeen = Date.now(),
    lastSeen = Date.now(),
    inputs = [],
    environment = null
  }) {
    this.id = id || `rare:${subject}:${outcome?.id || Date.now()}`;
    this.subject = subject;
    this.outcome = outcome;
    this.frequency = frequency;
    this.probability = probability;
    this.firstSeen = firstSeen;
    this.lastSeen = lastSeen;
    this.inputs = Object.freeze([...inputs]);
    this.environment = environment;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      subject: this.subject,
      outcome: this.outcome ? (this.outcome.toJSON ? this.outcome.toJSON() : this.outcome) : null,
      frequency: this.frequency,
      probability: this.probability,
      firstSeen: this.firstSeen,
      lastSeen: this.lastSeen,
      inputs: this.inputs,
      environment: this.environment
    };
  }
}
