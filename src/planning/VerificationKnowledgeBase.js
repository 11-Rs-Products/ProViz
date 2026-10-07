import { VerificationFact } from './VerificationFact.js';

export class VerificationKnowledgeBase {
  constructor() {
    this.facts = new Map(); // id -> VerificationFact
    this.bySubject = new Map(); // subject -> Array of VerificationFact
  }

  addFact(fact) {
    const f = fact instanceof VerificationFact ? fact : new VerificationFact(fact);
    this.facts.set(f.id, f);
    if (!this.bySubject.has(f.subject)) {
      this.bySubject.set(f.subject, []);
    }
    this.bySubject.get(f.subject).push(f);
    return this;
  }

  getFact(id) {
    return this.facts.get(String(id)) || null;
  }

  getFactsForSubject(subject) {
    return this.bySubject.get(String(subject)) || [];
  }

  getAllFacts() {
    return Array.from(this.facts.values());
  }

  toJSON() {
    return {
      facts: this.getAllFacts().map(f => f.toJSON())
    };
  }
}
