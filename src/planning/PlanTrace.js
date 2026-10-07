export class PlanTrace {
  constructor() {
    this.decisions = [];
  }

  recordDecision(decision) {
    this.decisions.push({
      ...decision,
      timestamp: Date.now()
    });
  }

  getDecisions() {
    return [...this.decisions];
  }

  toJSON() {
    return {
      totalDecisions: this.decisions.length,
      decisions: this.decisions
    };
  }
}
