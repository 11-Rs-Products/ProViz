/**
 * VerificationDebt.js
 * Represents unverified, untested, or stale project regions contributing to verification debt.
 */

export class VerificationDebtItem {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.targetEntity
   * @param {string} options.debtKind 'UNTESTED_CODE', 'STALE_SECURITY', 'UNVERIFIED_CONCURRENCY', 'EXPIRED_PERF_BASELINE'
   * @param {number} [options.risk=1.0]
   * @param {number} [options.scope=1.0]
   * @param {number} [options.staleness=1.0]
   * @param {string} [options.description='']
   */
  constructor({
    id,
    targetEntity,
    debtKind,
    risk = 1.0,
    scope = 1.0,
    staleness = 1.0,
    description = ''
  }) {
    if (!id || !targetEntity || !debtKind) {
      throw new Error('VerificationDebtItem requires id, targetEntity, and debtKind');
    }
    this.id = id;
    this.targetEntity = targetEntity;
    this.debtKind = debtKind;
    this.risk = risk;
    this.scope = scope;
    this.staleness = staleness;
    this.description = description;
    Object.freeze(this);
  }

  score() {
    return this.risk * this.scope * this.staleness;
  }

  toJSON() {
    return {
      id: this.id,
      targetEntity: this.targetEntity,
      debtKind: this.debtKind,
      risk: this.risk,
      scope: this.scope,
      staleness: this.staleness,
      score: this.score(),
      description: this.description
    };
  }
}
