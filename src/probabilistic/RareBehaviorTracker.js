import { RareBehavior } from './RareBehavior.js';

export class RareBehaviorTracker {
  constructor() {
    this.tracked = new Map(); // id -> RareBehavior
  }

  recordRareBehavior(rareBehavior) {
    const existing = this.tracked.get(rareBehavior.id);
    if (existing) {
      const updated = new RareBehavior({
        id: existing.id,
        subject: existing.subject,
        outcome: existing.outcome,
        frequency: existing.frequency + rareBehavior.frequency,
        probability: rareBehavior.probability,
        firstSeen: existing.firstSeen,
        lastSeen: Date.now(),
        inputs: [...existing.inputs, ...rareBehavior.inputs],
        environment: rareBehavior.environment || existing.environment
      });
      this.tracked.set(rareBehavior.id, updated);
    } else {
      this.tracked.set(rareBehavior.id, rareBehavior);
    }
    return this;
  }

  getAll() {
    return Array.from(this.tracked.values());
  }

  getForSubject(subject) {
    return this.getAll().filter(r => r.subject === subject);
  }

  toJSON() {
    return this.getAll().map(r => r.toJSON());
  }
}
