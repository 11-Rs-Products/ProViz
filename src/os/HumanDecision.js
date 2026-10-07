/**
 * HumanDecision.js
 * Record of an operator's approval, rejection, or amendment of an approval request.
 */

export class HumanDecision {
  /**
   * @param {Object} options
   * @param {string} options.requestId
   * @param {string} options.operatorId - Identity of human operator
   * @param {string} options.decision - 'APPROVED' | 'REJECTED' | 'AMENDED'
   * @param {string} [options.comments='']
   * @param {Object} [options.amendments={}]
   * @param {number} [options.timestamp]
   */
  constructor({
    requestId,
    operatorId,
    decision,
    comments = '',
    amendments = {},
    timestamp = Date.now()
  }) {
    if (!requestId || !operatorId || !decision) {
      throw new Error('HumanDecision requires requestId, operatorId, and decision');
    }
    this.requestId = requestId;
    this.operatorId = operatorId;
    this.decision = decision;
    this.comments = comments;
    this.amendments = Object.freeze({ ...amendments });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  get isApproved() {
    return this.decision === 'APPROVED';
  }

  toJSON() {
    return {
      requestId: this.requestId,
      operatorId: this.operatorId,
      decision: this.decision,
      isApproved: this.isApproved,
      comments: this.comments,
      amendments: this.amendments,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new HumanDecision(json);
  }
}
