export class PlanningExplanation {
  constructor({
    experimentId,
    selectedKind,
    targetSubject,
    reasons = [],
    summary = '',
    tradeoffs = []
  }) {
    this.experimentId = String(experimentId);
    this.selectedKind = selectedKind;
    this.targetSubject = String(targetSubject);
    this.reasons = Object.freeze([...reasons]);
    this.summary = String(summary || '');
    this.tradeoffs = Object.freeze([...tradeoffs]);
    Object.freeze(this);
  }

  toJSON() {
    return {
      experimentId: this.experimentId,
      selectedKind: this.selectedKind,
      targetSubject: this.targetSubject,
      reasons: this.reasons,
      summary: this.summary,
      tradeoffs: this.tradeoffs
    };
  }
}
