/**
 * VerifiedChangeSet.js
 * Immutable container for a change set that has passed verification and acceptance policy.
 */

const EMPTY_ARR = Object.freeze([]);
const EMPTY_OBJ = Object.freeze({});

export class VerifiedChangeSet {
  /**
   * @param {Object} options
   * @param {string} options.changeSetId
   * @param {Object} [options.semanticDiff={}]
   * @param {Object} [options.impactReport={}]
   * @param {Object} [options.riskReport={}]
   * @param {Object} [options.verificationReport={}]
   * @param {Array<Object>} [options.evidence=[]]
   * @param {Array<string>} [options.preservationClaims=[]]
   * @param {string} [options.rollbackCheckpoint='']
   * @param {Array<string>} [options.provenance=[]]
   */
  constructor({
    changeSetId,
    semanticDiff = null,
    impactReport = null,
    riskReport = null,
    verificationReport = null,
    evidence = null,
    preservationClaims = null,
    rollbackCheckpoint = '',
    provenance = null
  }) {
    if (!changeSetId) {
      throw new Error('VerifiedChangeSet requires changeSetId');
    }

    this.changeSetId = changeSetId;
    this.semanticDiff = semanticDiff ? Object.freeze({ ...semanticDiff }) : EMPTY_OBJ;
    this.impactReport = impactReport ? Object.freeze({ ...impactReport }) : EMPTY_OBJ;
    this.riskReport = riskReport ? Object.freeze({ ...riskReport }) : EMPTY_OBJ;
    this.verificationReport = verificationReport ? Object.freeze({ ...verificationReport }) : EMPTY_OBJ;
    this.evidence = evidence && evidence.length > 0 ? Object.freeze([...evidence]) : EMPTY_ARR;
    this.preservationClaims = preservationClaims && preservationClaims.length > 0 ? Object.freeze([...preservationClaims]) : EMPTY_ARR;
    this.rollbackCheckpoint = rollbackCheckpoint;
    this.provenance = provenance && provenance.length > 0 ? Object.freeze([...provenance]) : EMPTY_ARR;

    Object.freeze(this);
  }

  toJSON() {
    return {
      changeSetId: this.changeSetId,
      semanticDiff: this.semanticDiff,
      impactReport: this.impactReport,
      riskReport: this.riskReport,
      verificationReport: this.verificationReport,
      evidence: this.evidence,
      preservationClaims: [...this.preservationClaims],
      rollbackCheckpoint: this.rollbackCheckpoint,
      provenance: [...this.provenance]
    };
  }

  static fromJSON(json) {
    return new VerifiedChangeSet(json);
  }
}
