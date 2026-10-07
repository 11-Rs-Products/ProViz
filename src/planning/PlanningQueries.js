export class PlanningQueries {
  constructor(engine) {
    this.engine = engine;
  }

  getGoals() {
    return this.engine.goals;
  }

  getGoal(id) {
    return this.engine.goals.find(g => g.id === id) || null;
  }

  getEvidenceGaps() {
    return this.engine.gaps;
  }

  getExperimentCandidates() {
    return this.engine.candidates;
  }

  getSelectedExperiment() {
    return this.engine.selectedExperiment;
  }

  getPlanTrace() {
    return this.engine.trace ? this.engine.trace.getDecisions() : [];
  }

  getProgress() {
    const total = this.engine.goals.length;
    const satisfied = this.engine.goals.filter(g => g.isSatisfied()).length;
    return {
      totalGoals: total,
      satisfiedGoals: satisfied,
      percentComplete: total > 0 ? (satisfied / total) * 100 : 100
    };
  }

  getRisk(subject = 'overall') {
    return this.engine.getVerificationRisk(subject);
  }

  getStoppingDecision() {
    return this.engine.stoppingDecision;
  }
}
