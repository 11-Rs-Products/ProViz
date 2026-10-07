/**
 * Represents structured behavioral knowledge of an execution or component
 */
export class BehaviorKnowledge {
  constructor({
    behaviorId,
    entityId,
    inputSignature = {},
    stateTransitions = [],
    outputSignature = {},
    sideEffects = [],
    observations = [],
    confidence = 1.0,
    metadata = {}
  } = {}) {
    this.behaviorId = behaviorId || `beh-${Math.random().toString(36).slice(2, 9)}`;
    this.entityId = entityId;
    this.inputSignature = Object.freeze({ ...inputSignature });
    this.stateTransitions = Object.freeze([...stateTransitions]);
    this.outputSignature = Object.freeze({ ...outputSignature });
    this.sideEffects = Object.freeze([...sideEffects]);
    this.observations = Object.freeze([...observations]);
    this.confidence = Math.max(0, Math.min(1, confidence));
    this.metadata = Object.freeze({ ...metadata });
    Object.freeze(this);
  }

  toJSON() {
    return {
      behaviorId: this.behaviorId,
      entityId: this.entityId,
      inputSignature: { ...this.inputSignature },
      stateTransitions: [...this.stateTransitions],
      outputSignature: { ...this.outputSignature },
      sideEffects: [...this.sideEffects],
      observations: [...this.observations],
      confidence: this.confidence,
      metadata: { ...this.metadata }
    };
  }

  static fromJSON(json = {}) {
    return new BehaviorKnowledge(json);
  }
}

/**
 * Analyzes behavioral relationships: equivalence, divergence, refinement, regressions
 */
export class BehaviorRelationAnalyzer {
  static compareBehaviors(behA, behB) {
    if (!behA || !behB) {
      return { relation: 'INCOMPARABLE', score: 0.0 };
    }

    const sameOutput = JSON.stringify(behA.outputSignature) === JSON.stringify(behB.outputSignature);
    const sameTransitions = JSON.stringify(behA.stateTransitions) === JSON.stringify(behB.stateTransitions);
    const sameSideEffects = JSON.stringify(behA.sideEffects) === JSON.stringify(behB.sideEffects);

    if (sameOutput && sameTransitions && sameSideEffects) {
      return {
        relation: 'EQUIVALENT',
        similarityScore: 1.0,
        divergenceDetails: null
      };
    }

    if (!sameOutput) {
      return {
        relation: 'BEHAVIORAL_DIVERGENCE',
        similarityScore: 0.4,
        divergenceDetails: { outputA: behA.outputSignature, outputB: behB.outputSignature }
      };
    }

    return {
      relation: 'REFINEMENT',
      similarityScore: 0.8,
      divergenceDetails: { transitionsA: behA.stateTransitions.length, transitionsB: behB.stateTransitions.length }
    };
  }
}
