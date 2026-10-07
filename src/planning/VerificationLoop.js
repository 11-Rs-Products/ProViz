import { EvidenceGapAnalyzer } from './EvidenceGapAnalyzer.js';
import { ExperimentPlanner } from './ExperimentPlanner.js';
import { ExperimentSelector, SelectionPolicy } from './ExperimentSelector.js';
import { VerificationIteration } from './VerificationIteration.js';
import { ExperimentResult } from './ExperimentResult.js';

export class VerificationLoop {
  constructor({
    goals = [],
    policy = SelectionPolicy.BALANCED,
    maxIterations = 20,
    executorFn = null
  } = {}) {
    this.goals = [...goals];
    this.policy = policy;
    this.maxIterations = maxIterations;
    this.executorFn = executorFn;
    this.iterations = [];
    this.currentContext = {};
  }

  step(context = {}) {
    this.currentContext = { ...this.currentContext, ...context, goals: this.goals };
    const gaps = EvidenceGapAnalyzer.analyzeGaps(this.currentContext);
    if (gaps.length === 0) return null;

    const candidates = ExperimentPlanner.planExperiments(gaps, this.goals, this.currentContext);
    if (candidates.length === 0) return null;

    const selected = ExperimentSelector.selectNext(candidates, this.policy);
    if (!selected) return null;

    let result = null;
    if (typeof this.executorFn === 'function') {
      result = this.executorFn(selected.experiment, this.currentContext);
    } else {
      result = new ExperimentResult({
        experimentId: selected.experiment.id,
        success: true,
        outcome: 'SUCCESS',
        confidenceDelta: selected.expectedValue.confidenceGain,
        uncertaintyReduction: selected.expectedValue.uncertaintyReduction
      });
    }

    const iter = new VerificationIteration({
      iterationNumber: this.iterations.length + 1,
      gapsCount: gaps.length,
      candidatesCount: candidates.length,
      selectedExperiment: selected,
      result,
      confidenceDelta: result?.confidenceDelta || 0,
      uncertaintyDelta: result?.uncertaintyReduction || 0
    });
    this.iterations.push(iter);
    return iter;
  }

  run(context = {}) {
    this.currentContext = { ...context, goals: this.goals };
    let iterCount = 0;

    while (iterCount < this.maxIterations) {
      iterCount++;
      const gaps = EvidenceGapAnalyzer.analyzeGaps(this.currentContext);
      if (gaps.length === 0) break;

      const candidates = ExperimentPlanner.planExperiments(gaps, this.goals, this.currentContext);
      if (candidates.length === 0) break;

      const selected = ExperimentSelector.selectNext(candidates, this.policy);
      if (!selected) break;

      let result = null;
      if (typeof this.executorFn === 'function') {
        result = this.executorFn(selected.experiment, this.currentContext);
      } else {
        result = new ExperimentResult({
          experimentId: selected.experiment.id,
          success: true,
          outcome: 'SUCCESS',
          confidenceDelta: selected.expectedValue.confidenceGain,
          uncertaintyReduction: selected.expectedValue.uncertaintyReduction
        });
      }

      const iter = new VerificationIteration({
        iterationNumber: iterCount,
        gapsCount: gaps.length,
        candidatesCount: candidates.length,
        selectedExperiment: selected,
        result,
        confidenceDelta: result?.confidenceDelta || 0,
        uncertaintyDelta: result?.uncertaintyReduction || 0
      });
      this.iterations.push(iter);

      // Ingest evidence and update context
      if (result?.evidenceGenerated?.length > 0) {
        this.currentContext.proofs = [...(this.currentContext.proofs || []), ...result.evidenceGenerated];
      }
    }

    return {
      iterations: this.iterations,
      completedIterations: iterCount,
      finalContext: this.currentContext
    };
  }
}
