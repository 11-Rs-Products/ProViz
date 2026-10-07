import { ConfidenceScale } from './ConfidenceScale.js';
import { Uncertainty, UncertaintyKind } from './Uncertainty.js';

export class SpecificationEvidenceModel {
  constructor({
    specificationId,
    supportCount = 0,
    violationCount = 0,
    unknownCount = 0,
    conflictCount = 0,
    coverage = 0.0,
    stability = 1.0,
    confidence = ConfidenceScale.UNKNOWN,
    uncertainty = new Uncertainty({ kind: UncertaintyKind.UNKNOWN, score: 1.0 }),
    hasFormalProof = false
  }) {
    this.specificationId = specificationId;
    this.supportCount = supportCount;
    this.violationCount = violationCount;
    this.unknownCount = unknownCount;
    this.conflictCount = conflictCount;
    this.coverage = coverage;
    this.stability = stability;
    this.confidence = confidence;
    this.uncertainty = uncertainty;
    this.hasFormalProof = hasFormalProof;
    Object.freeze(this);
  }

  isSatisfied() {
    return this.violationCount === 0 && this.supportCount > 0;
  }

  isViolated() {
    return this.violationCount > 0;
  }

  toJSON() {
    return {
      specificationId: this.specificationId,
      supportCount: this.supportCount,
      violationCount: this.violationCount,
      unknownCount: this.unknownCount,
      conflictCount: this.conflictCount,
      coverage: this.coverage,
      stability: this.stability,
      confidence: this.confidence,
      uncertainty: this.uncertainty.toJSON(),
      hasFormalProof: this.hasFormalProof
    };
  }
}
