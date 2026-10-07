export class PlanningSnapshot {
  constructor({
    id,
    goals = [],
    gaps = [],
    candidates = [],
    decisions = [],
    strategyPerformance = [],
    randomSeed = 42,
    timestamp = Date.now()
  } = {}) {
    this.id = id || `plansnap_${timestamp}`;
    this.goals = Object.freeze([...goals]);
    this.gaps = Object.freeze([...gaps]);
    this.candidates = Object.freeze([...candidates]);
    this.decisions = Object.freeze([...decisions]);
    this.strategyPerformance = Object.freeze([...strategyPerformance]);
    this.randomSeed = randomSeed;
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      goals: this.goals.map(g => (g.toJSON ? g.toJSON() : g)),
      gaps: this.gaps.map(g => (g.toJSON ? g.toJSON() : g)),
      candidates: this.candidates.map(c => (c.toJSON ? c.toJSON() : c)),
      decisions: this.decisions,
      strategyPerformance: this.strategyPerformance,
      randomSeed: this.randomSeed,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    return new PlanningSnapshot(data);
  }
}
