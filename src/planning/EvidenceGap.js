import { EvidenceGapKind } from './EvidenceGapKind.js';

export class EvidenceGap {
  constructor({
    id,
    kind = EvidenceGapKind.MISSING_PROOF,
    subject,
    missingEvidence = '',
    currentConfidence = 0.0,
    desiredConfidence = 0.95,
    uncertainty = 1.0,
    severity = 'HIGH',
    possibleExperiments = [],
    estimatedCost = 1.0,
    rationale = '',
    metadata = {}
  }) {
    this.id = id || `gap_${kind}_${String(subject)}_${Date.now()}`;
    this.kind = kind;
    this.subject = String(subject);
    this.missingEvidence = String(missingEvidence || '');
    this.currentConfidence = Number(currentConfidence);
    this.desiredConfidence = Number(desiredConfidence);
    this.uncertainty = Number(uncertainty);
    this.severity = severity;
    this.possibleExperiments = Object.freeze([...possibleExperiments]);
    this.estimatedCost = Number(estimatedCost);
    this.rationale = String(rationale || '');
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      kind: this.kind,
      subject: this.subject,
      missingEvidence: this.missingEvidence,
      currentConfidence: this.currentConfidence,
      desiredConfidence: this.desiredConfidence,
      uncertainty: this.uncertainty,
      severity: this.severity,
      possibleExperiments: this.possibleExperiments,
      estimatedCost: this.estimatedCost,
      rationale: this.rationale,
      metadata: this.metadata
    };
  }
}
