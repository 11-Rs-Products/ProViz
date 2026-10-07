import { ConfidenceScale } from './ConfidenceScale.js';

export class ConfidenceCalibrationResult {
  constructor({
    subject,
    confidenceLevel = ConfidenceScale.UNKNOWN,
    score = 0.0,
    supportingEvidence = [],
    refutingEvidence = [],
    conflicts = [],
    hasFormalProof = false,
    explanation = '',
    breakdown = {}
  }) {
    this.subject = subject;
    this.confidenceLevel = confidenceLevel;
    this.score = score;
    this.supportingEvidence = Object.freeze([...supportingEvidence]);
    this.refutingEvidence = Object.freeze([...refutingEvidence]);
    this.conflicts = Object.freeze([...conflicts]);
    this.hasFormalProof = hasFormalProof;
    this.explanation = explanation;
    this.breakdown = Object.freeze({ ...breakdown });
    Object.freeze(this);
  }

  toJSON() {
    return {
      subject: this.subject,
      confidenceLevel: this.confidenceLevel,
      score: this.score,
      supportingCount: this.supportingEvidence.length,
      refutingCount: this.refutingEvidence.length,
      conflictsCount: this.conflicts.length,
      hasFormalProof: this.hasFormalProof,
      explanation: this.explanation,
      breakdown: this.breakdown
    };
  }
}
