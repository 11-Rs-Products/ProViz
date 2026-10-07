import { CrossLanguageBoundary } from './CrossLanguageBoundary.js';

/**
 * Connects caller proof, foreign-function boundary, and callee proof
 */
export class CrossLanguageEvidence {
  constructor({
    boundary,
    callerProof,
    calleeProof,
    boundaryVerification = null,
    isSound = true,
    metadata = {}
  } = {}) {
    this.boundary = boundary instanceof CrossLanguageBoundary ? boundary : new CrossLanguageBoundary(boundary);
    this.callerProof = callerProof;
    this.calleeProof = calleeProof;
    this.boundaryVerification = boundaryVerification;
    this.isSound = isSound && (boundaryVerification === null || Boolean(boundaryVerification?.isValid));
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      boundary: this.boundary.toJSON(),
      callerProof: this.callerProof,
      calleeProof: this.calleeProof,
      boundaryVerification: this.boundaryVerification,
      isSound: this.isSound,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json = {}) {
    return new CrossLanguageEvidence(json);
  }
}
