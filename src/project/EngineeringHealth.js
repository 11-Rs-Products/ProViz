/**
 * EngineeringHealth.js
 * Multidimensional vector representing project health across all individual dimensions.
 * Invariant: All underlying dimensions remain inspectable; summary score is derived.
 */

import { EngineeringHealthDimension } from './EngineeringHealthDimension.js';

export class EngineeringHealth {
  /**
   * @param {Object} options
   * @param {Object<string, number>} [options.dimensions={}] - Map dimension -> score [0.0, 1.0]
   * @param {Object<string, Object>} [options.evidence={}] - Evidence/rationale per dimension
   * @param {number} [options.timestamp]
   */
  constructor({
    dimensions = {},
    evidence = {},
    timestamp = Date.now()
  } = {}) {
    this.dimensions = {};
    for (const dim of Object.values(EngineeringHealthDimension)) {
      const val = dimensions[dim];
      this.dimensions[dim] = typeof val === 'number' ? Math.max(0, Math.min(1, val)) : 1.0;
    }
    Object.freeze(this.dimensions);

    this.evidence = Object.freeze({ ...evidence });
    this.timestamp = timestamp;
    Object.freeze(this);
  }

  getScore(dimension) {
    return this.dimensions[dimension] !== undefined ? this.dimensions[dimension] : 1.0;
  }

  getCompositeScore() {
    const vals = Object.values(this.dimensions);
    if (vals.length === 0) return 1.0;
    const sum = vals.reduce((a, b) => a + b, 0);
    return Number((sum / vals.length).toFixed(4));
  }

  get isHealthy() {
    return this.getCompositeScore() >= 0.75 && 
      this.getScore(EngineeringHealthDimension.CORRECTNESS) >= 0.8 &&
      this.getScore(EngineeringHealthDimension.SECURITY) >= 0.8;
  }

  toJSON() {
    return {
      compositeScore: this.getCompositeScore(),
      isHealthy: this.isHealthy,
      dimensions: { ...this.dimensions },
      evidence: { ...this.evidence },
      timestamp: this.timestamp
    };
  }

  static fromJSON(json) {
    return new EngineeringHealth(json);
  }
}
