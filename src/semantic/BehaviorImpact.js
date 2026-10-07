/**
 * BehaviorImpact.js
 * Represents predicted behavioral shifts resulting from a semantic program change.
 */

export const BehaviorImpactDimension = Object.freeze({
  RETURN_VALUE: 'RETURN_VALUE',
  EXCEPTION: 'EXCEPTION',
  STATE: 'STATE',
  HEAP: 'HEAP',
  IO: 'IO',
  TIMING: 'TIMING',
  ORDER: 'ORDER',
  SIDE_EFFECT: 'SIDE_EFFECT',
  NONDETERMINISM: 'NONDETERMINISM'
});

export class BehaviorImpact {
  /**
   * @param {Object} options
   * @param {string} options.targetId
   * @param {Array<string>} [options.affectedDimensions=[]] - BehaviorImpactDimension values
   * @param {number} [options.divergenceProbability=0.0] - Probability of behavioral change
   * @param {Object} [options.predictedChanges={}] - Details of output/state changes
   * @param {Array<string>} [options.evidence=[]]
   */
  constructor({
    targetId,
    affectedDimensions = [],
    divergenceProbability = 0.0,
    predictedChanges = {},
    evidence = []
  }) {
    if (!targetId) {
      throw new Error('BehaviorImpact requires targetId');
    }

    this.targetId = targetId;
    this.affectedDimensions = Object.freeze([...affectedDimensions]);
    this.divergenceProbability = Math.max(0.0, Math.min(1.0, Number(divergenceProbability) || 0.0));
    this.predictedChanges = Object.freeze({ ...predictedChanges });
    this.evidence = Object.freeze([...evidence]);

    Object.freeze(this);
  }

  toJSON() {
    return {
      targetId: this.targetId,
      affectedDimensions: [...this.affectedDimensions],
      divergenceProbability: this.divergenceProbability,
      predictedChanges: this.predictedChanges,
      evidence: [...this.evidence]
    };
  }

  static fromJSON(json) {
    return new BehaviorImpact(json);
  }
}
