import { Counterfactual } from './Counterfactual.js';

/**
 * Counterfactual Reasoning Engine simulating "what-if" scenarios across symbolic,
 * concolic, mutation, and repair layers without mutating active verification state.
 */
export class CounterfactualEngine {
  constructor(knowledgeGraph = null) {
    this.knowledgeGraph = knowledgeGraph;
    this._hypotheses = new Map();
  }

  simulateCounterfactual({
    targetEntityId,
    changedAssumption,
    baselineOutcome = {},
    simulationFn = null
  }) {
    let cfOutcome;
    if (typeof simulationFn === 'function') {
      cfOutcome = simulationFn({ targetEntityId, changedAssumption, baselineOutcome });
    } else {
      // Default heuristic counterfactual outcome
      cfOutcome = {
        behaviorChanged: true,
        findingResolved: Boolean(changedAssumption && (
          changedAssumption.includes('!= null') ||
          changedAssumption.includes('repaired') ||
          changedAssumption.includes('<') ||
          changedAssumption.includes('>') ||
          changedAssumption.includes('==') ||
          changedAssumption.includes('valid')
        )),
        simulatedState: { assumption: changedAssumption, result: 'SAT_UNDER_NEW_HYPOTHESIS' }
      };
    }

    const affectedEvidence = [];
    if (this.knowledgeGraph) {
      const descendants = this.knowledgeGraph.getDescendants(targetEntityId, { maxDepth: 5 });
      for (const d of descendants) {
        if (d.kind === 'EVIDENCE' || d.kind === 'PROOF' || d.kind === 'FINDING') {
          affectedEvidence.push(d.id);
        }
      }
    }

    const counterfactual = new Counterfactual({
      targetEntityId,
      changedAssumption,
      observedOutcome: baselineOutcome,
      counterfactualOutcome: cfOutcome,
      affectedEvidence,
      confidence: 0.95
    });

    this._hypotheses.set(counterfactual.hypothesisId, counterfactual);
    return counterfactual;
  }

  getHypothesis(hypothesisId) {
    return this._hypotheses.get(hypothesisId) || null;
  }

  getAllHypotheses() {
    return Array.from(this._hypotheses.values());
  }
}
