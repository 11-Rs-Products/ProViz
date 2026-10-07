/**
 * ArchitectureRepairDecision.js
 * Encapsulates the decision outcome of an architectural repair validation.
 */

export class ArchitectureRepairDecision {
  /**
   * @param {Object} options
   * @param {string} options.repairId
   * @param {string} options.outcome - 'APPLY_REPAIR' | 'REJECT_REPAIR' | 'REQUIRE_MANUAL_REVIEW'
   * @param {string} options.reason
   * @param {Object} [options.gateResults={}]
   */
  constructor({
    repairId,
    outcome,
    reason,
    gateResults = {}
  }) {
    this.repairId = repairId;
    this.outcome = outcome;
    this.reason = reason;
    this.gateResults = Object.freeze({ ...gateResults });
    this.timestamp = Date.now();
    Object.freeze(this);
  }

  get isAccepted() {
    return this.outcome === 'APPLY_REPAIR';
  }

  toJSON() {
    return {
      repairId: this.repairId,
      outcome: this.outcome,
      reason: this.reason,
      gateResults: this.gateResults,
      isAccepted: this.isAccepted,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new ArchitectureRepairDecision(json);
  }
}
