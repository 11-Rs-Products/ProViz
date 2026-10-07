/**
 * StateRevision.js
 * Immutable revision indicator supporting lineage, parent hash, and revision sequence numbers.
 */

export class StateRevision {
  /**
   * @param {Object} options
   * @param {number} options.sequenceNumber
   * @param {string} [options.revisionId]
   * @param {string|null} [options.parentRevisionId=null]
   * @param {number} [options.timestamp]
   */
  constructor({
    sequenceNumber,
    revisionId,
    parentRevisionId = null,
    timestamp = Date.now()
  }) {
    if (typeof sequenceNumber !== 'number') {
      throw new Error('StateRevision requires numeric sequenceNumber');
    }
    this.sequenceNumber = sequenceNumber;
    this.revisionId = revisionId || `REV_S${sequenceNumber}_${Date.now()}`;
    this.parentRevisionId = parentRevisionId;
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  next() {
    return new StateRevision({
      sequenceNumber: this.sequenceNumber + 1,
      parentRevisionId: this.revisionId,
      timestamp: Date.now()
    });
  }

  toJSON() {
    return {
      sequenceNumber: this.sequenceNumber,
      revisionId: this.revisionId,
      parentRevisionId: this.parentRevisionId,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new StateRevision(json);
  }
}
