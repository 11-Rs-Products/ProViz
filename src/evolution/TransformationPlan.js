/**
 * TransformationPlan.js
 * Multi-step directed transformation plan with ordering, checkpoints, and acceptance policies.
 */

import { Transformation } from './Transformation.js';

const EMPTY_ARR = Object.freeze([]);
const EMPTY_OBJ = Object.freeze({});

export class TransformationPlan {
  /**
   * @param {Object} options
   * @param {string} options.planId - Deterministic plan identifier
   * @param {Array<string>} [options.goals=[]] - Associated goal IDs
   * @param {Array<Transformation>} [options.transformations=[]] - Ordered or DAG-based transformations
   * @param {Map<string, Array<string>>|Object} [options.dependencies={}] - transformationId -> prerequisite transformationIds
   * @param {Array<string>} [options.ordering=[]] - Sequenced execution ordering
   * @param {Array<string>} [options.checkpoints=[]] - Safe rollback checkpoint IDs
   * @param {Array<string>} [options.validationStages=[]]
   * @param {string} [options.rollbackStrategy='ATOMIC_ROLLBACK']
   * @param {Object} [options.acceptancePolicy={}]
   */
  constructor({
    planId,
    goals = null,
    transformations = null,
    dependencies = null,
    ordering = null,
    checkpoints = null,
    validationStages = null,
    rollbackStrategy = 'ATOMIC_ROLLBACK',
    acceptancePolicy = null
  }) {
    if (!planId || typeof planId !== 'string') {
      throw new Error('TransformationPlan requires planId');
    }

    this.planId = planId;
    this.goals = goals && goals.length > 0 ? Object.freeze([...goals]) : EMPTY_ARR;
    this.transformations = transformations && transformations.length > 0
      ? Object.freeze(transformations.map(t => t instanceof Transformation ? t : Transformation.fromJSON(t)))
      : EMPTY_ARR;
    this.dependencies = dependencies ? Object.freeze({ ...dependencies }) : EMPTY_OBJ;
    this.ordering = ordering && ordering.length > 0
      ? Object.freeze([...ordering])
      : Object.freeze(this.transformations.map(t => t.transformationId));
    this.checkpoints = checkpoints && checkpoints.length > 0 ? Object.freeze([...checkpoints]) : EMPTY_ARR;
    this.validationStages = validationStages && validationStages.length > 0
      ? Object.freeze([...validationStages])
      : Object.freeze(['SYNTACTIC', 'SEMANTIC', 'CONTRACT', 'BEHAVIOR', 'REGRESSION']);
    this.rollbackStrategy = rollbackStrategy;
    this.acceptancePolicy = acceptancePolicy ? Object.freeze({ ...acceptancePolicy }) : Object.freeze({ minConfidence: 0.85, allowWarnings: false });

    Object.freeze(this);
  }

  toJSON() {
    return {
      planId: this.planId,
      goals: [...this.goals],
      transformations: this.transformations.map(t => t.toJSON()),
      dependencies: this.dependencies,
      ordering: [...this.ordering],
      checkpoints: [...this.checkpoints],
      validationStages: [...this.validationStages],
      rollbackStrategy: this.rollbackStrategy,
      acceptancePolicy: this.acceptancePolicy
    };
  }

  static fromJSON(json) {
    return new TransformationPlan(json);
  }
}
