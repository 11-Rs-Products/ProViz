/**
 * DebtTrend.js
 * Analyzes the trajectory of technical and verification debt across revisions.
 */

export class DebtTrend {
  /**
   * @param {Object} options
   * @param {string} options.direction - 'INCREASING' | 'DECREASING' | 'STABLE'
   * @param {number} options.deltaScore
   * @param {number} options.previousDebtScore
   * @param {number} options.currentDebtScore
   * @param {number} [options.timestamp]
   */
  constructor({
    direction,
    deltaScore,
    previousDebtScore,
    currentDebtScore,
    timestamp = Date.now()
  }) {
    this.direction = direction;
    this.deltaScore = Number(deltaScore.toFixed(4));
    this.previousDebtScore = previousDebtScore;
    this.currentDebtScore = currentDebtScore;
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      direction: this.direction,
      deltaScore: this.deltaScore,
      previousDebtScore: this.previousDebtScore,
      currentDebtScore: this.currentDebtScore,
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new DebtTrend(json);
  }
}
