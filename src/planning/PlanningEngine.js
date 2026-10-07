import { VerificationGoal } from './VerificationGoal.js';
import { VerificationGoalKind } from './VerificationGoalKind.js';
import { VerificationGoalStatus } from './VerificationGoalStatus.js';
import { EvidenceGapAnalyzer } from './EvidenceGapAnalyzer.js';
import { ExperimentPlanner } from './ExperimentPlanner.js';
import { ExperimentSelector, SelectionPolicy } from './ExperimentSelector.js';
import { VerificationPortfolio } from './VerificationPortfolio.js';
import { VerificationKnowledgeBase } from './VerificationKnowledgeBase.js';
import { StrategyLearner } from './StrategyLearner.js';
import { VerificationDependencyGraph } from './VerificationDependencyGraph.js';
import { PlanTrace } from './PlanTrace.js';
import { PlanningSnapshot } from './PlanningSnapshot.js';
import { PlanningQueries } from './PlanningQueries.js';
import { PlanningStoppingCriterion } from './PlanningStoppingCriterion.js';
import { VerificationRiskModel } from './VerificationRiskModel.js';
import { ChangeImpactAnalyzer } from './ChangeImpactAnalyzer.js';
import { PlanningSession } from './PlanningSession.js';
import { PlanningExplanation } from './PlanningExplanation.js';
import { ExperimentResult } from './ExperimentResult.js';

export class PlanningEngine {
  constructor({
    portfolio = new VerificationPortfolio(),
    policy = SelectionPolicy.BALANCED,
    knowledgeBase = new VerificationKnowledgeBase(),
    learner = new StrategyLearner(),
    dependencyGraph = new VerificationDependencyGraph()
  } = {}) {
    this.portfolio = portfolio;
    this.policy = policy;
    this.knowledgeBase = knowledgeBase;
    this.learner = learner;
    this.dependencyGraph = dependencyGraph;
    this.goals = [];
    this.gaps = [];
    this.candidates = [];
    this.selectedExperiment = null;
    this.trace = new PlanTrace();
    this.sessions = new Map();
    this.activeSession = null;
    this.stoppingDecision = null;
    this.queries = new PlanningQueries(this);
  }

  createGoal(goalOptions) {
    const goal = goalOptions instanceof VerificationGoal ? goalOptions : new VerificationGoal(goalOptions);
    this.goals.push(goal);
    return goal;
  }

  createGoalsFromEvidence(context = {}) {
    const created = [];

    // Stage 15 findings -> prove or disprove safety
    if (Array.isArray(context.findings)) {
      for (const finding of context.findings) {
        const subject = finding.subject || finding.location || finding.id;
        const g = new VerificationGoal({
          kind: VerificationGoalKind.FINDING,
          target: subject,
          desiredConfidence: 0.95,
          currentConfidence: finding.confidence || 0.4,
          severity: finding.severity || 'HIGH',
          rationale: `Prove or disprove finding ${finding.type || finding.id}`
        });
        this.goals.push(g);
        created.push(g);
      }
    }

    // Stage 20 surviving mutants -> test adequacy
    if (Array.isArray(context.survivingMutants)) {
      for (const mutant of context.survivingMutants) {
        const subject = mutant.subject || mutant.id;
        const g = new VerificationGoal({
          kind: VerificationGoalKind.MUTATION_SURVIVOR,
          target: subject,
          desiredConfidence: 0.90,
          currentConfidence: 0.50,
          severity: 'MEDIUM',
          rationale: `Kill surviving mutant ${mutant.id} and improve test adequacy`
        });
        this.goals.push(g);
        created.push(g);
      }
    }

    // Stage 24 rare behaviors / anomalies -> reproduce and classify
    if (Array.isArray(context.anomalies)) {
      for (const anomaly of context.anomalies) {
        const g = new VerificationGoal({
          kind: VerificationGoalKind.ANOMALY,
          target: anomaly.subject,
          desiredConfidence: 0.85,
          currentConfidence: 0.40,
          severity: 'MEDIUM',
          rationale: `Reproduce and classify rare anomaly ${anomaly.id}`
        });
        this.goals.push(g);
        created.push(g);
      }
    }

    return created;
  }

  planNextAction(context = {}) {
    this.gaps = EvidenceGapAnalyzer.analyzeGaps(context);
    this.candidates = ExperimentPlanner.planExperiments(this.gaps, this.goals, context);
    this.selectedExperiment = ExperimentSelector.selectNext(this.candidates, this.policy);

    if (this.selectedExperiment) {
      this.trace.recordDecision({
        experimentId: this.selectedExperiment.experiment.id,
        kind: this.selectedExperiment.experiment.kind,
        target: this.selectedExperiment.experiment.target,
        utility: this.selectedExperiment.utility,
        policy: this.policy
      });
    }

    return this.selectedExperiment;
  }

  executeNextExperiment(executorFn = null, context = {}) {
    const candidate = this.planNextAction(context);
    if (!candidate) return null;

    let result = null;
    if (typeof executorFn === 'function') {
      result = executorFn(candidate.experiment, context);
    } else {
      result = new ExperimentResult({
        experimentId: candidate.experiment.id,
        success: true,
        outcome: 'SUCCESS',
        confidenceDelta: candidate.expectedValue.confidenceGain,
        uncertaintyReduction: candidate.expectedValue.uncertaintyReduction
      });
    }

    // Update learner
    this.learner.recordRun(this.policy, {
      success: result.success,
      informationGain: candidate.expectedValue.informationGain,
      executionCostMs: result.executionCostMs || 10,
      confidenceDelta: result.confidenceDelta
    });

    // Update goal statuses
    for (let i = 0; i < this.goals.length; i++) {
      const g = this.goals[i];
      if (g.target === candidate.experiment.target) {
        const nextConf = Math.min(1.0, g.currentConfidence + (result.confidenceDelta || 0.1));
        const status = nextConf >= g.desiredConfidence ? VerificationGoalStatus.SATISFIED : VerificationGoalStatus.IN_PROGRESS;
        this.goals[i] = g.withStatus(status, nextConf);
      }
    }

    return result;
  }

  createSession(options = {}) {
    const session = new PlanningSession({
      goals: this.goals,
      portfolio: this.portfolio,
      ...options
    });
    this.sessions.set(session.id, session);
    this.activeSession = session;
    return session;
  }

  getVerificationRisk(subject = 'overall') {
    const factors = {
      defectLikelihood: 0.5,
      impact: 0.5,
      uncertainty: this.gaps.length > 0 ? 0.7 : 0.2
    };
    return VerificationRiskModel.evaluateSubjectRisk(subject, factors);
  }

  explainPlan() {
    if (!this.selectedExperiment) return 'No experiment currently selected.';
    const exp = this.selectedExperiment;
    return new PlanningExplanation({
      experimentId: exp.experiment.id,
      selectedKind: exp.experiment.kind,
      targetSubject: exp.experiment.target,
      reasons: [exp.rationale || 'Optimal expected utility'],
      summary: `${exp.experiment.kind} selected for ${exp.experiment.target} under ${this.policy} policy.`
    });
  }

  getSnapshot() {
    return new PlanningSnapshot({
      goals: this.goals,
      gaps: this.gaps,
      candidates: this.candidates,
      decisions: this.trace.getDecisions(),
      strategyPerformance: this.learner.getAllPerformances(),
      randomSeed: 42
    });
  }
}
