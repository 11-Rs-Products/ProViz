export class ExperimentOutcomeModel {
  constructor() {
    this.history = []; // Array of LearningObservation
  }

  recordObservation(obs) {
    this.history.push(obs);
  }

  getExpectedUtilityForGap(experimentKind, gapKind) {
    const matching = this.history.filter(h => h.experimentKind === experimentKind && h.targetGapKind === gapKind);
    if (matching.length === 0) return null;

    const sumVal = matching.reduce((acc, h) => acc + h.actualValue, 0);
    const sumCost = matching.reduce((acc, h) => acc + h.costMs, 0);
    return {
      avgValue: sumVal / matching.length,
      avgCostMs: sumCost / matching.length,
      sampleCount: matching.length
    };
  }

  toJSON() {
    return {
      totalObservations: this.history.length,
      observations: this.history.map(h => (h.toJSON ? h.toJSON() : h))
    };
  }
}
