/**
 * TransformationCandidate.js
 * Represents a concrete synthesized candidate solution for a transformation goal.
 */

import { Transformation } from './Transformation.js';
import { TransformationEdit } from './TransformationEdit.js';

const EMPTY_ARR = Object.freeze([]);
const EMPTY_OBJ = Object.freeze({});

export class TransformationCandidate {
  /**
   * @param {Object} options
   * @param {string} options.candidateId - Unique deterministic candidate identifier
   * @param {Transformation} options.transformation - Transformation specification
   * @param {Array<TransformationEdit>} [options.edits=[]] - Sequence of atomic source edits
   * @param {Object} [options.semanticDelta={}] - AST & graph diff descriptor
   * @param {Object} [options.predictedImpact={}] - Predicted impact scores from Stage 29
   * @param {Object} [options.predictedRisk={}] - Predicted risk model
   * @param {Array<string>} [options.preservationClaims=[]] - Claims of what this candidate preserves
   * @param {string} [options.validationStatus='UNVALIDATED'] - 'UNVALIDATED' | 'VALID' | 'INVALID'
   * @param {string} [options.verificationStatus='UNVERIFIED'] - 'UNVERIFIED' | 'VERIFIED' | 'REJECTED'
   * @param {Array<string>} [options.provenance=[]]
   */
  constructor({
    candidateId,
    transformation,
    edits = null,
    semanticDelta = null,
    predictedImpact = null,
    predictedRisk = null,
    preservationClaims = null,
    validationStatus = 'UNVALIDATED',
    verificationStatus = 'UNVERIFIED',
    provenance = null
  }) {
    if (!candidateId || typeof candidateId !== 'string') {
      throw new Error('TransformationCandidate requires candidateId');
    }
    if (!transformation) {
      throw new Error('TransformationCandidate requires a transformation');
    }

    this.candidateId = candidateId;
    this.transformation = transformation instanceof Transformation
      ? transformation
      : Transformation.fromJSON(transformation);
    this.edits = edits && edits.length > 0
      ? Object.freeze(edits.map(e => e instanceof TransformationEdit ? e : TransformationEdit.fromJSON(e)))
      : EMPTY_ARR;
    this.semanticDelta = semanticDelta ? Object.freeze({ ...semanticDelta }) : EMPTY_OBJ;
    this.predictedImpact = predictedImpact ? Object.freeze({ ...predictedImpact }) : EMPTY_OBJ;
    this.predictedRisk = predictedRisk ? Object.freeze({ ...predictedRisk }) : EMPTY_OBJ;
    this.preservationClaims = preservationClaims && preservationClaims.length > 0
      ? Object.freeze([...preservationClaims])
      : EMPTY_ARR;
    this.validationStatus = validationStatus;
    this.verificationStatus = verificationStatus;
    this.provenance = provenance && provenance.length > 0 ? Object.freeze([...provenance]) : EMPTY_ARR;

    Object.freeze(this);
  }

  withStatus({ validationStatus, verificationStatus }) {
    return new TransformationCandidate({
      ...this.toJSON(),
      validationStatus: validationStatus || this.validationStatus,
      verificationStatus: verificationStatus || this.verificationStatus
    });
  }

  toJSON() {
    return {
      candidateId: this.candidateId,
      transformation: this.transformation.toJSON(),
      edits: this.edits.map(e => e.toJSON()),
      semanticDelta: this.semanticDelta,
      predictedImpact: this.predictedImpact,
      predictedRisk: this.predictedRisk,
      preservationClaims: [...this.preservationClaims],
      validationStatus: this.validationStatus,
      verificationStatus: this.verificationStatus,
      provenance: [...this.provenance]
    };
  }

  static fromJSON(json) {
    return new TransformationCandidate(json);
  }
}
