/**
 * HealthTrend.js
 * Represents comparative trajectory between two or more health evaluations over revisions/time.
 */

export class HealthTrend {
  /**
   * @param {Object} options
   * @param {string} options.direction - 'IMPROVING' | 'DEGRADING' | 'STABLE'
   * @param {number} options.delta
   * @param {Object<string, number>} [options.dimensionDeltas={}]
   * @param {string[]} [options.improvingDimensions=[]]
   * @param {string[]} [options.degradingDimensions=[]]
   * @param {number} [options.timestamp]
   */
  constructor({
    direction,
    delta,
    dimensionDeltas = {},
    improvingDimensions = [],
    degradingDimensions = [],
    timestamp = Date.now()
  }) {
    this.direction = direction;
    this.delta = Number(delta.toFixed(4));
    this.dimensionDeltas = Object.freeze({ ...dimensionDeltas });
    this.improvingDimensions = Object.freeze([...improvingDimensions]);
    this.degradingDimensions = Object.freeze([...degradingDimensions]);
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  toJSON() {
    return {
      direction: this.direction,
      delta: this.delta,
      dimensionDeltas: { ...this.dimensionDeltas },
      improvingDimensions: [...this.improvingDimensions],
      degradingDimensions: [...this.degradingDimensions],
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new HealthTrend(json);
  }
}
