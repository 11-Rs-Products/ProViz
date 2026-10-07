/**
 * Captures deep semantic regression impact beyond simple pass/fail test status
 */
export class RegressionKnowledge {
  constructor({
    regressionId,
    changedBehaviors = [],
    brokenDependencies = [],
    invalidatedEvidence = [],
    specificationDrift = [],
    riskIncrease = 0.0,
    impactScore = 0.0,
    metadata = {}
  } = {}) {
    this.regressionId = regressionId || `regr-know-${Math.random().toString(36).slice(2, 9)}`;
    this.changedBehaviors = Object.freeze([...changedBehaviors]);
    this.brokenDependencies = Object.freeze([...brokenDependencies]);
    this.invalidatedEvidence = Object.freeze([...invalidatedEvidence]);
    this.specificationDrift = Object.freeze([...specificationDrift]);
    this.riskIncrease = Math.max(0, riskIncrease);
    this.impactScore = impactScore || this._computeImpactScore();
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  _computeImpactScore() {
    return (
      this.changedBehaviors.length * 1.5 +
      this.brokenDependencies.length * 2.0 +
      this.invalidatedEvidence.length * 3.0 +
      this.specificationDrift.length * 2.5 +
      this.riskIncrease * 5.0
    );
  }

  toJSON() {
    return {
      regressionId: this.regressionId,
      changedBehaviors: [...this.changedBehaviors],
      brokenDependencies: [...this.brokenDependencies],
      invalidatedEvidence: [...this.invalidatedEvidence],
      specificationDrift: [...this.specificationDrift],
      riskIncrease: this.riskIncrease,
      impactScore: this.impactScore,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json = {}) {
    return new RegressionKnowledge(json);
  }
}

/**
 * Analyzes semantic regression impact across knowledge, dependency, and evidence graphs
 */
export class RegressionKnowledgeAnalyzer {
  static analyzeRegression({
    changedBehaviors = [],
    brokenDependencies = [],
    invalidatedEvidence = [],
    specificationDrift = [],
    riskIncrease = 0.1
  }) {
    return new RegressionKnowledge({
      changedBehaviors,
      brokenDependencies,
      invalidatedEvidence,
      specificationDrift,
      riskIncrease
    });
  }
}
