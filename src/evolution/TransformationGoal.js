/**
 * TransformationGoal.js
 * Represents the objective and requirements of why a transformation should occur.
 */

export const GoalCategory = Object.freeze({
  CORRECTNESS: 'CORRECTNESS',
  PERFORMANCE: 'PERFORMANCE',
  SECURITY: 'SECURITY',
  MAINTAINABILITY: 'MAINTAINABILITY',
  READABILITY: 'READABILITY',
  MODULARITY: 'MODULARITY',
  API_EVOLUTION: 'API_EVOLUTION',
  TECHNICAL_DEBT: 'TECHNICAL_DEBT',
  RESOURCE_EFFICIENCY: 'RESOURCE_EFFICIENCY',
  ARCHITECTURE: 'ARCHITECTURE',
  SPECIFICATION: 'SPECIFICATION',
  TESTABILITY: 'TESTABILITY',
  RELIABILITY: 'RELIABILITY',
  COMPATIBILITY: 'COMPATIBILITY',
  CUSTOM: 'CUSTOM'
});

const EMPTY_ARR = Object.freeze([]);
const EMPTY_OBJ = Object.freeze({});

export class TransformationGoal {
  /**
   * @param {Object} options
   * @param {string} options.id - Deterministic goal ID
   * @param {string} options.category - GoalCategory
   * @param {string} options.objective - Human/machine readable description
   * @param {string} [options.priority='MEDIUM'] - 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
   * @param {string} [options.scope='LOCAL'] - 'LOCAL' | 'FUNCTION' | 'MODULE' | 'PROJECT' | 'SYSTEM'
   * @param {Array<string>} [options.constraints=[]] - Constraint identifiers
   * @param {Object} [options.acceptanceCriteria={}] - Validation and verification criteria
   * @param {number} [options.riskBudget=0.5] - Maximum acceptable risk threshold [0.0, 1.0]
   * @param {Array<string>} [options.preservationRequirements=[]] - Property identifiers to preserve
   * @param {Object} [options.metadata={}]
   */
  constructor({
    id,
    category = GoalCategory.MAINTAINABILITY,
    objective,
    priority = 'MEDIUM',
    scope = 'LOCAL',
    constraints = null,
    acceptanceCriteria = null,
    riskBudget = 0.5,
    preservationRequirements = null,
    metadata = null
  }) {
    if (!id || typeof id !== 'string') {
      throw new Error('TransformationGoal requires a valid string id');
    }
    if (!objective) {
      throw new Error('TransformationGoal requires an objective');
    }

    this.id = id;
    this.category = category;
    this.objective = objective;
    this.priority = priority;
    this.scope = scope;
    this.constraints = constraints && constraints.length > 0 ? Object.freeze([...constraints]) : EMPTY_ARR;
    this.acceptanceCriteria = acceptanceCriteria ? Object.freeze({ ...acceptanceCriteria }) : EMPTY_OBJ;
    this.riskBudget = typeof riskBudget === 'number' ? Math.max(0.0, Math.min(1.0, riskBudget)) : 0.5;
    this.preservationRequirements = preservationRequirements && preservationRequirements.length > 0
      ? Object.freeze([...preservationRequirements])
      : EMPTY_ARR;
    this.metadata = metadata ? Object.freeze({ ...metadata }) : EMPTY_OBJ;

    Object.freeze(this);
  }

  toJSON() {
    return {
      id: this.id,
      category: this.category,
      objective: this.objective,
      priority: this.priority,
      scope: this.scope,
      constraints: [...this.constraints],
      acceptanceCriteria: this.acceptanceCriteria,
      riskBudget: this.riskBudget,
      preservationRequirements: [...this.preservationRequirements],
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    return new TransformationGoal(json);
  }
}
