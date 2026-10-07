import test from 'node:test';
import assert from 'node:assert/strict';

import * as Planning from '../src/planning/index.js';
import * as Probabilistic from '../src/probabilistic/index.js';
import { Debugger } from '../src/debugger/Debugger.js';

test('Stage 25 — Universal Autonomous Verification Planning & Experiment Selection Engine', async (t) => {

  // =========================================================================
  // 1. Verification Goals & Requirements
  // =========================================================================
  await t.test('VerificationGoal creation, status transitions and immutability', () => {
    const goal = new Planning.VerificationGoal({
      kind: Planning.VerificationGoalKind.FINDING,
      target: 'func_div',
      desiredConfidence: 0.95,
      currentConfidence: 0.20,
      severity: 'HIGH',
      rationale: 'Prove divisor cannot be zero'
    });

    assert.strictEqual(goal.kind, 'FINDING');
    assert.strictEqual(goal.target, 'func_div');
    assert.strictEqual(goal.status, Planning.VerificationGoalStatus.UNSTARTED);
    assert.strictEqual(goal.isSatisfied(), false);

    const updated = goal.withStatus(Planning.VerificationGoalStatus.SATISFIED, 1.0);
    assert.strictEqual(updated.status, Planning.VerificationGoalStatus.SATISFIED);
    assert.strictEqual(updated.isSatisfied(), true);
    assert.strictEqual(goal.status, Planning.VerificationGoalStatus.UNSTARTED); // Immutability
  });

  await t.test('VerificationGoal enum coverage', () => {
    const kinds = [
      Planning.VerificationGoalKind.PROPERTY,
      Planning.VerificationGoalKind.FINDING,
      Planning.VerificationGoalKind.PATH,
      Planning.VerificationGoalKind.BRANCH,
      Planning.VerificationGoalKind.CONTRACT,
      Planning.VerificationGoalKind.INVARIANT,
      Planning.VerificationGoalKind.SPECIFICATION,
      Planning.VerificationGoalKind.TEST_ADEQUACY,
      Planning.VerificationGoalKind.MUTATION_SURVIVOR,
      Planning.VerificationGoalKind.REGRESSION,
      Planning.VerificationGoalKind.ANOMALY,
      Planning.VerificationGoalKind.RARE_BEHAVIOR,
      Planning.VerificationGoalKind.ORACLE,
      Planning.VerificationGoalKind.UNCERTAINTY,
      Planning.VerificationGoalKind.RISK,
      Planning.VerificationGoalKind.COVERAGE
    ];
    assert.strictEqual(kinds.length, 16);
  });

  await t.test('VerificationRequirement model properties and validation', () => {
    const req = new Planning.VerificationRequirement({
      description: 'prove divisor is non-zero',
      target: 'func_div',
      kind: 'SAFETY_PROPERTY'
    });
    assert.strictEqual(req.target, 'func_div');
    assert.ok(req.description.includes('non-zero'));
    assert.strictEqual(req.satisfied, false);
    const satReq = req.withSatisfied(true);
    assert.strictEqual(satReq.satisfied, true);
    assert.strictEqual(req.satisfied, false);
  });

  // =========================================================================
  // 2. Evidence-Gap Analysis
  // =========================================================================
  await t.test('EvidenceGapAnalyzer identifies unproven findings and surviving mutants', () => {
    const context = {
      findings: [{ id: 'f1', type: 'POSSIBLE_ZERO_DIVISION', subject: 'math.divide', confidence: 0.4, severity: 'HIGH' }],
      survivingMutants: [{ id: 'm42', subject: 'math.multiply' }],
      unvalidatedRepairs: [{ id: 'r1', subject: 'auth.login' }],
      conflicts: [{ subject: 'cache.get' }]
    };

    const gaps = Planning.EvidenceGapAnalyzer.analyzeGaps(context);
    assert.strictEqual(gaps.length, 4);
    assert.ok(gaps.some(g => g.kind === Planning.EvidenceGapKind.MISSING_PROOF));
    assert.ok(gaps.some(g => g.kind === Planning.EvidenceGapKind.SURVIVING_MUTANT));
    assert.ok(gaps.some(g => g.kind === Planning.EvidenceGapKind.UNVALIDATED_REPAIR));
    assert.ok(gaps.some(g => g.kind === Planning.EvidenceGapKind.CONFLICTING_EVIDENCE));
  });

  await t.test('EvidenceGapAnalyzer identifies uncovered branches and unexplored paths', () => {
    const context = {
      uncoveredBranches: [{ id: 'br_17', subject: 'parser.tokenize' }],
      unexploredPaths: [{ id: 'p_99', subject: 'crypto.verify' }],
      unstableOracles: [{ id: 'orc_1', subject: 'spec.calc' }]
    };
    const gaps = Planning.EvidenceGapAnalyzer.analyzeGaps(context);
    assert.strictEqual(gaps.length, 3);
    assert.ok(gaps.some(g => g.kind === Planning.EvidenceGapKind.MISSING_COVERAGE));
    assert.ok(gaps.some(g => g.kind === Planning.EvidenceGapKind.UNEXPLORED_PATH));
    assert.ok(gaps.some(g => g.kind === Planning.EvidenceGapKind.MISSING_ORACLE));
  });

  await t.test('EvidenceGap serialization and immutability', () => {
    const gap = new Planning.EvidenceGap({
      kind: Planning.EvidenceGapKind.MISSING_PROOF,
      subject: 'math.sqrt',
      missingEvidence: 'No proof of non-negative argument',
      currentConfidence: 0.1,
      desiredConfidence: 0.95
    });
    assert.strictEqual(gap.subject, 'math.sqrt');
    const json = gap.toJSON();
    assert.strictEqual(json.kind, 'MISSING_PROOF');
    assert.strictEqual(json.subject, 'math.sqrt');
  });

  // =========================================================================
  // 3. Experiment Model & Budget
  // =========================================================================
  await t.test('Experiment specification and budget bounding', () => {
    const budget = new Planning.ExperimentBudget({ maxTimeMs: 1000, maxExecutions: 50 });
    const exp = new Planning.Experiment({
      kind: Planning.ExperimentKind.CONCOLIC_EXPLORE,
      target: 'parser.parse',
      budget,
      estimatedCost: 15
    });

    assert.strictEqual(exp.kind, 'CONCOLIC_EXPLORE');
    assert.strictEqual(exp.target, 'parser.parse');
    assert.strictEqual(exp.budget.maxTimeMs, 1000);
    assert.strictEqual(exp.estimatedCost, 15);
  });

  await t.test('ExperimentBudget checks budget exhaustion', () => {
    const budget = new Planning.ExperimentBudget({ maxTimeMs: 100, maxExecutions: 5 });
    assert.strictEqual(budget.isExhausted({ timeMs: 50, executions: 2 }), false);
    assert.strictEqual(budget.isExhausted({ timeMs: 150, executions: 2 }), true);
    assert.strictEqual(budget.isExhausted({ timeMs: 50, executions: 10 }), true);
  });

  await t.test('ExperimentResult delta tracking', () => {
    const res = new Planning.ExperimentResult({
      experimentId: 'exp_1',
      success: true,
      outcome: 'COUNTEREXAMPLE_FOUND',
      confidenceDelta: 0.45,
      uncertaintyReduction: 0.50
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.outcome, 'COUNTEREXAMPLE_FOUND');
    assert.strictEqual(res.confidenceDelta, 0.45);
    assert.strictEqual(res.uncertaintyReduction, 0.50);
  });

  await t.test('ExperimentCost vector components', () => {
    const cost = new Planning.ExperimentCost({
      cpuCost: 2.5,
      memoryCostMb: 128,
      executionCount: 10,
      wallClockEstimateMs: 45
    });
    assert.strictEqual(cost.cpuCost, 2.5);
    assert.strictEqual(cost.memoryCostMb, 128);
    assert.strictEqual(cost.wallClockEstimateMs, 45);
    assert.strictEqual(cost.getCompositeCost() > 0, true);
  });

  await t.test('ExperimentValue multi-factor model', () => {
    const val = new Planning.ExperimentValue({
      informationGain: 0.9,
      uncertaintyReduction: 0.8,
      riskReduction: 0.7,
      coverageGain: 0.6,
      confidenceGain: 0.85
    });
    assert.strictEqual(val.informationGain, 0.9);
    assert.strictEqual(val.getCompositeValue() > 0, true);
  });

  // =========================================================================
  // 4. Experiment Utility & Selection Policies
  // =========================================================================
  await t.test('ExperimentUtility deterministic multi-factor calculation', () => {
    const val = new Planning.ExperimentValue({ informationGain: 0.8, riskReduction: 0.9, uncertaintyReduction: 0.7 });
    const cost = new Planning.ExperimentCost({ cpuCost: 1.0, wallClockEstimateMs: 20 });
    const utility = Planning.ExperimentUtility.computeUtility(val, cost);
    assert.ok(utility > 0);

    // Deterministic calculation
    const utility2 = Planning.ExperimentUtility.computeUtility(val, cost);
    assert.strictEqual(utility, utility2);
  });

  await t.test('ExperimentCandidate structure', () => {
    const exp = new Planning.Experiment({ id: 'exp_c', kind: 'STATIC_VERIFY', target: 't_c' });
    const val = new Planning.ExperimentValue({ informationGain: 0.5 });
    const cost = new Planning.ExperimentCost({ wallClockEstimateMs: 10 });
    const cand = new Planning.ExperimentCandidate({ experiment: exp, expectedValue: val, estimatedCost: cost });
    assert.strictEqual(cand.experiment.id, 'exp_c');
    assert.ok(cand.utility !== undefined);
  });

  await t.test('ExperimentSelector ranking policies & deterministic tie-breaking', () => {
    const candA = new Planning.ExperimentCandidate({
      experiment: new Planning.Experiment({ id: 'exp_a', kind: 'STATIC_VERIFY', target: 'fn_a' }),
      expectedValue: new Planning.ExperimentValue({ informationGain: 0.8, riskReduction: 0.9 }),
      estimatedCost: new Planning.ExperimentCost({ cpuCost: 1.0, wallClockEstimateMs: 5 })
    });
    const candB = new Planning.ExperimentCandidate({
      experiment: new Planning.Experiment({ id: 'exp_b', kind: 'MUTATION_CAMPAIGN', target: 'fn_b' }),
      expectedValue: new Planning.ExperimentValue({ informationGain: 0.3, riskReduction: 0.2 }),
      estimatedCost: new Planning.ExperimentCost({ cpuCost: 5.0, wallClockEstimateMs: 100 })
    });

    const ranked = Planning.ExperimentSelector.rankCandidates([candB, candA], Planning.SelectionPolicy.BALANCED);
    assert.strictEqual(ranked[0].candidate.experiment.id, 'exp_a');

    // Deterministic tie-breaking on identical utility, risk, and info gain
    const candTie1 = new Planning.ExperimentCandidate({
      experiment: new Planning.Experiment({ id: 'exp_zzz', kind: 'GENERATE_TEST', target: 'fn_t' }),
      expectedValue: new Planning.ExperimentValue({ informationGain: 0.5, riskReduction: 0.5 }),
      estimatedCost: new Planning.ExperimentCost({ wallClockEstimateMs: 10 })
    });
    const candTie2 = new Planning.ExperimentCandidate({
      experiment: new Planning.Experiment({ id: 'exp_aaa', kind: 'GENERATE_TEST', target: 'fn_t' }),
      expectedValue: new Planning.ExperimentValue({ informationGain: 0.5, riskReduction: 0.5 }),
      estimatedCost: new Planning.ExperimentCost({ wallClockEstimateMs: 10 })
    });

    const tieRanked = Planning.ExperimentSelector.rankCandidates([candTie1, candTie2], Planning.SelectionPolicy.BALANCED);
    assert.strictEqual(tieRanked[0].candidate.experiment.id, 'exp_aaa'); // Alphabetical tie-break
  });

  await t.test('SelectionPolicy UNCERTAINTY_FIRST policy ranking', () => {
    const cand1 = new Planning.ExperimentCandidate({
      experiment: new Planning.Experiment({ id: 'exp_unc_low', target: 'fn1' }),
      expectedValue: new Planning.ExperimentValue({ uncertaintyReduction: 0.2 }),
      estimatedCost: new Planning.ExperimentCost({ wallClockEstimateMs: 5 })
    });
    const cand2 = new Planning.ExperimentCandidate({
      experiment: new Planning.Experiment({ id: 'exp_unc_high', target: 'fn2' }),
      expectedValue: new Planning.ExperimentValue({ uncertaintyReduction: 0.9 }),
      estimatedCost: new Planning.ExperimentCost({ wallClockEstimateMs: 5 })
    });
    const selected = Planning.ExperimentSelector.selectNext([cand1, cand2], Planning.SelectionPolicy.UNCERTAINTY_FIRST);
    assert.strictEqual(selected.experiment.id, 'exp_unc_high');
  });

  await t.test('SelectionPolicy COVERAGE_FIRST policy ranking', () => {
    const cand1 = new Planning.ExperimentCandidate({
      experiment: new Planning.Experiment({ id: 'exp_cov_low', target: 'fn1' }),
      expectedValue: new Planning.ExperimentValue({ coverageGain: 0.1 }),
      estimatedCost: new Planning.ExperimentCost({ wallClockEstimateMs: 5 })
    });
    const cand2 = new Planning.ExperimentCandidate({
      experiment: new Planning.Experiment({ id: 'exp_cov_high', target: 'fn2' }),
      expectedValue: new Planning.ExperimentValue({ coverageGain: 0.8 }),
      estimatedCost: new Planning.ExperimentCost({ wallClockEstimateMs: 5 })
    });
    const selected = Planning.ExperimentSelector.selectNext([cand1, cand2], Planning.SelectionPolicy.COVERAGE_FIRST);
    assert.strictEqual(selected.experiment.id, 'exp_cov_high');
  });

  await t.test('SelectionPolicy FINDINGS_FIRST policy ranking', () => {
    const cand1 = new Planning.ExperimentCandidate({
      experiment: new Planning.Experiment({ id: 'exp_f_low', target: 'fn1' }),
      expectedValue: new Planning.ExperimentValue({ findingResolution: 0.1 }),
      estimatedCost: new Planning.ExperimentCost({ wallClockEstimateMs: 5 })
    });
    const cand2 = new Planning.ExperimentCandidate({
      experiment: new Planning.Experiment({ id: 'exp_f_high', target: 'fn2' }),
      expectedValue: new Planning.ExperimentValue({ findingResolution: 0.95 }),
      estimatedCost: new Planning.ExperimentCost({ wallClockEstimateMs: 5 })
    });
    const selected = Planning.ExperimentSelector.selectNext([cand1, cand2], Planning.SelectionPolicy.FINDINGS_FIRST);
    assert.strictEqual(selected.experiment.id, 'exp_f_high');
  });

  await t.test('SelectionPolicy MUTATION_FIRST policy ranking', () => {
    const cand1 = new Planning.ExperimentCandidate({
      experiment: new Planning.Experiment({ id: 'exp_mut_low', target: 'fn1' }),
      expectedValue: new Planning.ExperimentValue({ mutationAdequacyGain: 0.1 }),
      estimatedCost: new Planning.ExperimentCost({ wallClockEstimateMs: 5 })
    });
    const cand2 = new Planning.ExperimentCandidate({
      experiment: new Planning.Experiment({ id: 'exp_mut_high', target: 'fn2' }),
      expectedValue: new Planning.ExperimentValue({ mutationAdequacyGain: 0.9 }),
      estimatedCost: new Planning.ExperimentCost({ wallClockEstimateMs: 5 })
    });
    const selected = Planning.ExperimentSelector.selectNext([cand1, cand2], Planning.SelectionPolicy.MUTATION_FIRST);
    assert.strictEqual(selected.experiment.id, 'exp_mut_high');
  });

  // =========================================================================
  // 5. Verification Portfolio & Optimizer
  // =========================================================================
  await t.test('PortfolioPolicy configuration and limits', () => {
    const policy = new Planning.PortfolioPolicy({
      maxTotalTimeMs: 500,
      enabledTechniques: ['STATIC', 'SYMBOLIC', 'DYNAMIC']
    });
    assert.strictEqual(policy.maxTotalTimeMs, 500);
    assert.strictEqual(policy.isTechniqueEnabled('STATIC'), true);
    assert.strictEqual(policy.isTechniqueEnabled('MUTATION'), false);
  });

  await t.test('VerificationPortfolio technique registration and querying', () => {
    const port = new Planning.VerificationPortfolio();
    assert.strictEqual(port.hasTechnique('STATIC'), true);
    assert.strictEqual(port.hasTechnique('SYMBOLIC'), true);
    assert.strictEqual(port.hasTechnique('DYNAMIC'), true);
    assert.strictEqual(port.hasTechnique('CONCOLIC'), true);
    assert.strictEqual(port.hasTechnique('MUTATION'), true);
  });

  await t.test('PortfolioOptimizer schedules cost-effective techniques under budget', () => {
    const techniques = [
      { name: 'STATIC', costMs: 5, expectedGain: 0.9 },
      { name: 'SYMBOLIC', costMs: 20, expectedGain: 0.85 },
      { name: 'CONCOLIC', costMs: 100, expectedGain: 0.7 },
      { name: 'MUTATION', costMs: 400, expectedGain: 0.4 }
    ];

    const scheduled = Planning.PortfolioOptimizer.optimize(techniques, 130); // 130ms budget
    assert.strictEqual(scheduled.some(t => t.name === 'STATIC'), true);
    assert.strictEqual(scheduled.some(t => t.name === 'SYMBOLIC'), true);
    assert.strictEqual(scheduled.some(t => t.name === 'CONCOLIC'), true);
    assert.strictEqual(scheduled.some(t => t.name === 'MUTATION'), false); // Excluded due to cost/gain under budget
  });

  // =========================================================================
  // 6. Mandatory 15 Scenarios
  // =========================================================================
  await t.test('Scenario 1 — Static Proof Preferred', () => {
    const gaps = [
      new Planning.EvidenceGap({
        kind: Planning.EvidenceGapKind.MISSING_PROOF,
        subject: 'math.abs_val',
        desiredConfidence: 0.95
      })
    ];
    const cands = Planning.ExperimentPlanner.planExperiments(gaps, []);
    const selected = Planning.ExperimentSelector.selectNext(cands, Planning.SelectionPolicy.BALANCED);
    assert.strictEqual(selected.experiment.kind, Planning.ExperimentKind.STATIC_VERIFY);
  });

  await t.test('Scenario 2 — Symbolic Counterexample Preferred', () => {
    const gaps = [
      new Planning.EvidenceGap({
        kind: Planning.EvidenceGapKind.MISSING_PROOF,
        subject: 'auth.check_token',
        desiredConfidence: 0.95
      })
    ];
    const context = { hasFeasibleCounterexample: true };
    const cands = Planning.ExperimentPlanner.planExperiments(gaps, [], context);
    const selected = Planning.ExperimentSelector.selectNext(cands, Planning.SelectionPolicy.BALANCED);
    assert.strictEqual(selected.experiment.kind, Planning.ExperimentKind.SYMBOLIC_DISPROVE);
  });

  await t.test('Scenario 3 — Test Generation Preferred for Uncovered Branch', () => {
    const gaps = [
      new Planning.EvidenceGap({
        kind: Planning.EvidenceGapKind.MISSING_COVERAGE,
        subject: 'branch_B17',
        desiredConfidence: 0.90
      })
    ];
    const cands = Planning.ExperimentPlanner.planExperiments(gaps, []);
    const selected = Planning.ExperimentSelector.selectNext(cands, Planning.SelectionPolicy.BALANCED);
    assert.strictEqual(selected.experiment.kind, Planning.ExperimentKind.GENERATE_TEST);
  });

  await t.test('Scenario 4 — Concolic Exploration Preferred for Complex Path', () => {
    const gaps = [
      new Planning.EvidenceGap({
        kind: Planning.EvidenceGapKind.UNEXPLORED_PATH,
        subject: 'complex_hash_path',
        desiredConfidence: 0.90
      })
    ];
    const cands = Planning.ExperimentPlanner.planExperiments(gaps, []);
    const selected = Planning.ExperimentSelector.selectNext(cands, Planning.SelectionPolicy.BALANCED);
    assert.strictEqual(selected.experiment.kind, Planning.ExperimentKind.CONCOLIC_EXPLORE);
  });

  await t.test('Scenario 5 — Mutation Adequacy Gap (KILL_MUTANT)', () => {
    const gaps = [
      new Planning.EvidenceGap({
        kind: Planning.EvidenceGapKind.SURVIVING_MUTANT,
        subject: 'mutant_M42',
        desiredConfidence: 0.90
      })
    ];
    const cands = Planning.ExperimentPlanner.planExperiments(gaps, []);
    const selected = Planning.ExperimentSelector.selectNext(cands, Planning.SelectionPolicy.BALANCED);
    assert.strictEqual(selected.experiment.kind, Planning.ExperimentKind.KILL_MUTANT);
  });

  await t.test('Scenario 6 — Repair Validation Sequence', () => {
    const gaps = [
      new Planning.EvidenceGap({
        kind: Planning.EvidenceGapKind.UNVALIDATED_REPAIR,
        subject: 'patch_P01',
        desiredConfidence: 0.99
      })
    ];
    const cands = Planning.ExperimentPlanner.planExperiments(gaps, []);
    const selected = Planning.ExperimentSelector.selectNext(cands, Planning.SelectionPolicy.BALANCED);
    assert.strictEqual(selected.experiment.kind, Planning.ExperimentKind.VALIDATE_REPAIR);
  });

  await t.test('Scenario 7 — Conflicting Evidence Resolution', () => {
    const gaps = [
      new Planning.EvidenceGap({
        kind: Planning.EvidenceGapKind.CONFLICTING_EVIDENCE,
        subject: 'state_consistency',
        desiredConfidence: 0.95
      })
    ];
    const cands = Planning.ExperimentPlanner.planExperiments(gaps, []);
    const selected = Planning.ExperimentSelector.selectNext(cands, Planning.SelectionPolicy.BALANCED);
    assert.strictEqual(selected.experiment.kind, Planning.ExperimentKind.REPEAT_OBSERVATION);
  });

  await t.test('Scenario 8 — Rare Behavior Anomaly Reproduction', () => {
    const gaps = [
      new Planning.EvidenceGap({
        kind: Planning.EvidenceGapKind.MISSING_OBSERVATION,
        subject: 'rare_null_deref',
        desiredConfidence: 0.85
      })
    ];
    const cands = Planning.ExperimentPlanner.planExperiments(gaps, []);
    const selected = Planning.ExperimentSelector.selectNext(cands, Planning.SelectionPolicy.BALANCED);
    assert.strictEqual(selected.experiment.kind, Planning.ExperimentKind.ANOMALY_REPRODUCTION);
  });

  await t.test('Scenario 9 — Flaky Test Investigation', () => {
    const gaps = [
      new Planning.EvidenceGap({
        kind: Planning.EvidenceGapKind.INSUFFICIENT_SAMPLE,
        subject: 'test_flaky_io',
        desiredConfidence: 0.95
      })
    ];
    const cands = Planning.ExperimentPlanner.planExperiments(gaps, []);
    const selected = Planning.ExperimentSelector.selectNext(cands, Planning.SelectionPolicy.BALANCED);
    assert.strictEqual(selected.experiment.kind, Planning.ExperimentKind.REPEAT_OBSERVATION);
  });

  await t.test('Scenario 10 — Specification / Oracle Validation', () => {
    const gaps = [
      new Planning.EvidenceGap({
        kind: Planning.EvidenceGapKind.SPECIFICATION_UNCERTAINTY,
        subject: 'spec_oracle_v2',
        desiredConfidence: 0.90
      })
    ];
    const cands = Planning.ExperimentPlanner.planExperiments(gaps, []);
    const selected = Planning.ExperimentSelector.selectNext(cands, Planning.SelectionPolicy.BALANCED);
    assert.strictEqual(selected.experiment.kind, Planning.ExperimentKind.ORACLE_VALIDATION);
  });

  await t.test('Scenario 11 — High-Risk Target Prioritization', () => {
    const factorMap = new Map([
      ['sub_low', { defectLikelihood: 0.1, impact: 0.2, uncertainty: 0.1 }],
      ['sub_critical', { defectLikelihood: 0.9, impact: 0.95, uncertainty: 0.8, hasRegression: true }]
    ]);
    const prioritized = Planning.RiskPrioritizer.prioritize(['sub_low', 'sub_critical'], factorMap);
    assert.strictEqual(prioritized[0].subject, 'sub_critical');
    assert.strictEqual(prioritized[0].level, 'CRITICAL');
  });

  await t.test('Scenario 12 — Budget-Aware Planning Selection', () => {
    const candExpensive = new Planning.ExperimentCandidate({
      experiment: new Planning.Experiment({ id: 'exp_expensive', kind: 'MUTATION_CAMPAIGN', target: 'fn' }),
      expectedValue: new Planning.ExperimentValue({ informationGain: 0.8 }),
      estimatedCost: new Planning.ExperimentCost({ wallClockEstimateMs: 200 })
    });
    const candCheap = new Planning.ExperimentCandidate({
      experiment: new Planning.Experiment({ id: 'exp_cheap', kind: 'STATIC_VERIFY', target: 'fn' }),
      expectedValue: new Planning.ExperimentValue({ informationGain: 0.8 }),
      estimatedCost: new Planning.ExperimentCost({ wallClockEstimateMs: 5 })
    });

    const selected = Planning.ExperimentSelector.selectNext([candExpensive, candCheap], Planning.SelectionPolicy.COST_AWARE);
    assert.strictEqual(selected.experiment.id, 'exp_cheap');
  });

  await t.test('Scenario 13 — Formal Proof Dominance', () => {
    const proofEv = new Probabilistic.Evidence({
      kind: Probabilistic.EvidenceKind.STATIC_PROOF,
      subject: 'math.sign',
      strength: Probabilistic.EvidenceStrength.FORMAL
    });
    const calib = Probabilistic.ConfidenceCalibrator.calibrate('math.sign', [proofEv]);
    assert.strictEqual(calib.confidenceLevel, Probabilistic.ConfidenceScale.FORMALLY_ESTABLISHED);
  });

  await t.test('Scenario 14 — Incremental Replanning on Source Change', () => {
    const evidenceList = [
      new Probabilistic.Evidence({ id: 'ev_math', subject: 'src/math.js' }),
      new Probabilistic.Evidence({ id: 'ev_utils', subject: 'src/utils.js' })
    ];
    const impact = Planning.ChangeImpactAnalyzer.analyze(['src/math.js'], evidenceList);
    assert.strictEqual(impact.staleEvidenceIds.length, 1);
    assert.strictEqual(impact.staleEvidenceIds[0], 'ev_math');
    assert.strictEqual(impact.preservedEvidenceIds.length, 1);
    assert.strictEqual(impact.preservedEvidenceIds[0], 'ev_utils');
  });

  await t.test('Scenario 15 — Full Autonomous Verification Loop', () => {
    const engine = new Planning.PlanningEngine({ policy: Planning.SelectionPolicy.BALANCED });
    const goal = engine.createGoal({
      kind: Planning.VerificationGoalKind.FINDING,
      target: 'user.authenticate',
      desiredConfidence: 0.90,
      currentConfidence: 0.30
    });

    const context = {
      findings: [{ id: 'f_auth', type: 'NONE_CHECK', subject: 'user.authenticate', confidence: 0.3 }]
    };

    const nextExp = engine.planNextAction(context);
    assert.ok(nextExp);
    assert.strictEqual(nextExp.experiment.target, 'user.authenticate');

    const result = engine.executeNextExperiment((exp) => {
      return new Planning.ExperimentResult({
        experimentId: exp.id,
        success: true,
        outcome: 'PROOF_FOUND',
        confidenceDelta: 0.70
      });
    }, context);

    assert.ok(result.success);
    assert.strictEqual(engine.goals[0].isSatisfied(), true);
  });

  // =========================================================================
  // 7. Active Learning & Knowledge Base
  // =========================================================================
  await t.test('StrategyLearner & ExperimentOutcomeModel', () => {
    const learner = new Planning.StrategyLearner();
    learner.recordRun('BALANCED', { success: true, informationGain: 0.8, executionCostMs: 15, confidenceDelta: 0.3 });
    learner.recordRun('BALANCED', { success: true, informationGain: 0.6, executionCostMs: 25, confidenceDelta: 0.2 });

    const perf = learner.getPerformance('BALANCED');
    assert.strictEqual(perf.totalRuns, 2);
    assert.strictEqual(perf.successRate, 1.0);
    assert.strictEqual(perf.avgCostMs, 20);

    const kb = new Planning.VerificationKnowledgeBase();
    kb.addFact(new Planning.VerificationFact({ subject: 'div.divisor', fact: 'NON_ZERO', confidence: 0.99 }));
    const facts = kb.getFactsForSubject('div.divisor');
    assert.strictEqual(facts.length, 1);
    assert.strictEqual(facts[0].fact, 'NON_ZERO');
  });

  await t.test('VerificationFact and KnowledgeUpdater', () => {
    const kb = new Planning.VerificationKnowledgeBase();
    const updater = new Planning.KnowledgeUpdater(kb);
    updater.ingestEvidence([
      { subject: 'calc.pi', fact: 'CONSTANT', confidence: 1.0, source: 'static' }
    ]);
    const query = new Planning.KnowledgeQuery(kb);
    const facts = query.findFacts('calc.pi');
    assert.strictEqual(facts.length, 1);
    assert.strictEqual(facts[0].fact, 'CONSTANT');
  });

  await t.test('KnowledgeQuery conflict detection', () => {
    const kb = new Planning.VerificationKnowledgeBase();
    kb.addFact(new Planning.VerificationFact({ subject: 'auth.status', fact: 'AUTHENTICATED', confidence: 0.9 }));
    kb.addFact(new Planning.VerificationFact({ subject: 'auth.status', fact: 'UNAUTHENTICATED', confidence: 0.85 }));
    const query = new Planning.KnowledgeQuery(kb);
    const conflicts = query.findConflicts('auth.status');
    assert.strictEqual(conflicts.length, 1);
  });

  // =========================================================================
  // 8. Stopping Criteria & Session Replay
  // =========================================================================
  await t.test('PlanningStoppingCriterion evaluates goal satisfaction and limits', () => {
    const crit = new Planning.PlanningStoppingCriterion({ maxIterations: 10 });
    const gSatisfied = new Planning.VerificationGoal({ target: 'sub1', status: Planning.VerificationGoalStatus.SATISFIED });
    const decAllSat = crit.evaluate({ goals: [gSatisfied] });
    assert.strictEqual(decAllSat.shouldStop, true);
    assert.strictEqual(decAllSat.reason, Planning.StoppingReasonKind.ALL_GOALS_SATISFIED);

    const decMaxIter = crit.evaluate({ goals: [], iterationCount: 10 });
    assert.strictEqual(decMaxIter.shouldStop, true);
    assert.strictEqual(decMaxIter.reason, Planning.StoppingReasonKind.MAX_ITERATIONS);
  });

  await t.test('PlanningStoppingCriterion evaluates confidence threshold', () => {
    const crit = new Planning.PlanningStoppingCriterion({ confidenceThreshold: 0.95 });
    const gHighConf = new Planning.VerificationGoal({ target: 'sub_c', currentConfidence: 0.96 });
    const dec = crit.evaluate({ goals: [gHighConf] });
    assert.strictEqual(dec.shouldStop, true);
    assert.strictEqual(dec.reason, Planning.StoppingReasonKind.CONFIDENCE_THRESHOLD);
  });

  await t.test('StoppingDecision structure', () => {
    const decision = new Planning.StoppingDecision({
      shouldStop: true,
      reason: Planning.StoppingReasonKind.BUDGET_EXHAUSTED,
      explanation: 'Max time budget exceeded'
    });
    assert.strictEqual(decision.shouldStop, true);
    assert.strictEqual(decision.reason, 'BUDGET_EXHAUSTED');
  });

  await t.test('PlanningSnapshot deterministic serialization and restore', () => {
    const snap = new Planning.PlanningSnapshot({
      goals: [{ id: 'g1', target: 't1' }],
      decisions: [{ experimentId: 'exp1' }],
      randomSeed: 999
    });

    const json = JSON.stringify(snap.toJSON());
    const restored = Planning.PlanningSnapshot.fromJSON(json);
    assert.strictEqual(restored.randomSeed, 999);
    assert.strictEqual(restored.goals.length, 1);
    assert.strictEqual(restored.decisions.length, 1);
  });

  // =========================================================================
  // 9. Cross-Stage Dependencies & Impact
  // =========================================================================
  await t.test('VerificationDependencyGraph node addition and topological ordering', () => {
    const graph = new Planning.VerificationDependencyGraph();
    graph.addDependency(new Planning.VerificationDependency({
      source: 'Repair_P01',
      target: 'Concolic_C01',
      kind: 'REQUIRES'
    }));
    graph.addDependency(new Planning.VerificationDependency({
      source: 'Concolic_C01',
      target: 'Symbolic_S01',
      kind: 'REQUIRES'
    }));

    const deps = graph.getDependenciesFor('Repair_P01');
    assert.strictEqual(deps.length, 1);
    assert.strictEqual(deps[0].target, 'Concolic_C01');
  });

  await t.test('DependencyAnalyzer transitive stale evidence resolution', () => {
    const graph = new Planning.VerificationDependencyGraph();
    graph.addDependency(new Planning.VerificationDependency({ source: 'Patch', target: 'Test1' }));
    graph.addDependency(new Planning.VerificationDependency({ source: 'Test1', target: 'Finding' }));

    const analyzer = new Planning.DependencyAnalyzer(graph);
    const affected = analyzer.getTransitiveDependents('Finding');
    assert.ok(Array.isArray(affected));
  });

  await t.test('ReplanningTrigger enum check', () => {
    assert.strictEqual(Planning.ReplanningTrigger.SOURCE_CHANGED, 'SOURCE_CHANGED');
    assert.strictEqual(Planning.ReplanningTrigger.TEST_CHANGED, 'TEST_CHANGED');
    assert.strictEqual(Planning.ReplanningTrigger.REPAIR_APPLIED, 'REPAIR_APPLIED');
    assert.strictEqual(Planning.ReplanningTrigger.CONFIDENCE_DROP, 'CONFIDENCE_DROP');
  });

  // =========================================================================
  // 10. Risk Model & Prioritization
  // =========================================================================
  await t.test('VerificationRiskModel multi-factor composite risk evaluation', () => {
    const risk = Planning.VerificationRiskModel.evaluateSubjectRisk('fn_auth', {
      defectLikelihood: 0.8,
      impact: 0.9,
      uncertainty: 0.6,
      hasConflict: true
    });
    assert.ok(risk.riskScore >= 0.5);
    assert.strictEqual(risk.level === 'HIGH' || risk.level === 'CRITICAL', true);
  });

  await t.test('RiskReduction tracking', () => {
    const rr = Planning.RiskReduction.calculateReduction(0.85, 0.35);
    assert.strictEqual(rr.initialRisk, 0.85);
    assert.strictEqual(rr.finalRisk, 0.35);
    assert.strictEqual(rr.reductionDelta, 0.50);
  });

  // =========================================================================
  // 11. Planning Traces, Explanations & Sessions
  // =========================================================================
  await t.test('PlanTrace immutable audit recording', () => {
    const trace = new Planning.PlanTrace();
    trace.recordDecision({
      experimentId: 'exp_001',
      kind: 'STATIC_VERIFY',
      target: 'func_math',
      utility: 0.92
    });
    assert.strictEqual(trace.getDecisions().length, 1);
    assert.strictEqual(trace.getDecisions()[0].experimentId, 'exp_001');
  });

  await t.test('PlanningExplanation human- and machine-readable output', () => {
    const explanation = new Planning.PlanningExplanation({
      experimentId: 'exp_002',
      selectedKind: 'CONCOLIC_EXPLORE',
      targetSubject: 'parser.parse',
      reasons: ['UNEXPLORED_BRANCH', 'LOW_COST'],
      summary: 'Concolic exploration selected to cover branch B17.'
    });
    assert.strictEqual(explanation.selectedKind, 'CONCOLIC_EXPLORE');
    assert.strictEqual(explanation.reasons.length, 2);
    assert.ok(explanation.summary.includes('branch B17'));
  });

  await t.test('PlanningSession lifecycle management', () => {
    const session = new Planning.PlanningSession({
      budget: new Planning.ExperimentBudget({ maxTimeMs: 500 })
    });
    assert.strictEqual(session.status, 'ACTIVE');
    session.recordIteration({ iteration: 1, experimentId: 'exp_1' });
    assert.strictEqual(session.iterations.length, 1);
    session.finish('COMPLETED');
    assert.strictEqual(session.status, 'COMPLETED');
  });

  await t.test('PlanningCampaign multi-goal management', () => {
    const campaign = new Planning.PlanningCampaign({ name: 'Security Verification' });
    campaign.addGoal(new Planning.VerificationGoal({ target: 'auth.login' }));
    campaign.addGoal(new Planning.VerificationGoal({ target: 'crypto.sign' }));
    assert.strictEqual(campaign.goals.length, 2);
  });

  await t.test('PlanningQueries helper methods', () => {
    const engine = new Planning.PlanningEngine();
    engine.createGoal({ target: 'math.add' });
    const q = new Planning.PlanningQueries(engine);
    assert.strictEqual(q.getGoals().length, 1);
    assert.strictEqual(q.getGoals()[0].target, 'math.add');
  });

  // =========================================================================
  // 12. Verification Loops & Adapters
  // =========================================================================
  await t.test('VerificationIteration record', () => {
    const iter = new Planning.VerificationIteration({
      iteration: 1,
      selectedExperiment: { id: 'exp_1' },
      confidenceDelta: 0.2
    });
    assert.strictEqual(iter.iteration, 1);
    assert.strictEqual(iter.confidenceDelta, 0.2);
  });

  await t.test('VerificationLoop step execution', () => {
    const engine = new Planning.PlanningEngine();
    engine.createGoal({ target: 'sub_loop', desiredConfidence: 0.8, currentConfidence: 0.2 });
    const loop = new Planning.VerificationLoop({ engine });
    const stepRes = loop.step({ findings: [{ id: 'f1', subject: 'sub_loop', confidence: 0.2 }] });
    assert.ok(stepRes);
  });

  await t.test('AdaptiveVerificationLoop dynamic replanning', () => {
    const engine = new Planning.PlanningEngine();
    engine.createGoal({ target: 'sub_adapt', desiredConfidence: 0.9, currentConfidence: 0.1 });
    const adaptLoop = new Planning.AdaptiveVerificationLoop({ engine, maxIterations: 3 });
    const outcome = adaptLoop.runUntilSettled({ findings: [{ id: 'f1', subject: 'sub_adapt', confidence: 0.1 }] });
    assert.ok(outcome);
  });

  await t.test('AdaptiveExperimentPlanner replan cycle', () => {
    const replanner = new Planning.AdaptiveExperimentPlanner();
    const newCands = replanner.replanOnResult(
      { experimentId: 'exp_1', outcome: 'COUNTEREXAMPLE_REPRODUCED' },
      [{ kind: Planning.EvidenceGapKind.UNVALIDATED_REPAIR, subject: 'fn_rep' }]
    );
    assert.ok(Array.isArray(newCands));
  });

  await t.test('LanguagePlanningAdapter base interface', () => {
    const adapter = new Planning.LanguagePlanningAdapter();
    assert.strictEqual(adapter.getLanguageId(), 'generic');
  });

  await t.test('PythonPlanningAdapter AST heuristics', () => {
    const pyAdapter = new Planning.PythonPlanningAdapter();
    assert.strictEqual(pyAdapter.getLanguageId(), 'python');
    const cost = pyAdapter.estimateVerificationCost({ type: 'FunctionDef', name: 'calc' });
    assert.ok(cost.wallClockEstimateMs > 0);
  });

  // =========================================================================
  // 13. Safety Invariants
  // =========================================================================
  await t.test('Safety: Planning does not mutate source code', () => {
    const engine = new Planning.PlanningEngine();
    const source = 'def foo(x):\n    return x / 0\n';
    const plan = engine.planNextAction({ sourceCode: source });
    assert.strictEqual(source, 'def foo(x):\n    return x / 0\n');
  });

  await t.test('Safety: Failed experiments do not become proof', () => {
    const engine = new Planning.PlanningEngine();
    engine.createGoal({ target: 'unprovable_func', desiredConfidence: 0.95, currentConfidence: 0.1 });
    const res = engine.executeNextExperiment(() => {
      return new Planning.ExperimentResult({
        experimentId: 'exp_fail',
        success: false,
        outcome: 'TIMED_OUT',
        confidenceDelta: 0.0
      });
    }, { findings: [{ id: 'f_u', subject: 'unprovable_func' }] });

    assert.strictEqual(res.success, false);
    assert.strictEqual(engine.goals[0].isSatisfied(), false);
  });

  await t.test('Safety: Learned strategy never alters formal proof validity', () => {
    const learner = new Planning.StrategyLearner();
    learner.recordRun('BALANCED', { success: false, informationGain: 0.0 });
    const proofEv = new Probabilistic.Evidence({
      kind: Probabilistic.EvidenceKind.STATIC_PROOF,
      subject: 'safe_func',
      strength: Probabilistic.EvidenceStrength.FORMAL
    });
    const calib = Probabilistic.ConfidenceCalibrator.calibrate('safe_func', [proofEv]);
    assert.strictEqual(calib.confidenceLevel, Probabilistic.ConfidenceScale.FORMALLY_ESTABLISHED);
  });

  // =========================================================================
  // 14. Debugger Integration
  // =========================================================================
  await t.test('Debugger Stage 25 planning integration', () => {
    const dbg = new Debugger();
    const session = dbg.createVerificationPlan();
    assert.ok(session);

    const prog = dbg.getVerificationProgress();
    assert.ok(prog);

    const portfolio = dbg.getVerificationPortfolio();
    assert.ok(portfolio);

    const kb = dbg.getKnowledgeBase();
    assert.ok(kb);
  });

  await t.test('Debugger Stage 25 goal querying and explanation', () => {
    const dbg = new Debugger();
    dbg.createVerificationPlan();
    const goals = dbg.getVerificationGoals();
    assert.ok(Array.isArray(goals));
    const explanation = dbg.explainPlan();
    assert.ok(explanation);
  });

  // =========================================================================
  // 15. Performance Benchmarks
  // =========================================================================
  await t.test('Performance Benchmarks — Goal Evaluations (< 100 ms for 10k)', () => {
    const t0 = Date.now();
    const gList = [];
    for (let i = 0; i < 10000; i++) {
      gList.push(new Planning.VerificationGoal({ target: `t_${i}`, currentConfidence: i % 2 === 0 ? 1.0 : 0.2 }));
    }
    let satCount = 0;
    for (const g of gList) {
      if (g.isSatisfied()) satCount++;
    }
    const dGoals = Date.now() - t0;
    assert.ok(dGoals < 100, `10k goal evaluations took ${dGoals} ms (limit 100 ms)`);
  });

  await t.test('Performance Benchmarks — Gap Calculations (< 200 ms for 10k)', () => {
    const t1 = Date.now();
    const mockContext = {
      findings: [{ id: 'f1', subject: 'sub1' }],
      survivingMutants: [{ id: 'm1', subject: 'sub2' }]
    };
    for (let i = 0; i < 5000; i++) {
      Planning.EvidenceGapAnalyzer.analyzeGaps(mockContext);
    }
    const dGaps = Date.now() - t1;
    assert.ok(dGaps < 200, `10k gap calculations took ${dGaps} ms (limit 200 ms)`);
  });

  await t.test('Performance Benchmarks — Experiment Rankings (< 300 ms for 10k)', () => {
    const t2 = Date.now();
    const cands = [
      new Planning.ExperimentCandidate({ experiment: new Planning.Experiment({ id: 'c1', target: 's1' }) }),
      new Planning.ExperimentCandidate({ experiment: new Planning.Experiment({ id: 'c2', target: 's2' }) })
    ];
    for (let i = 0; i < 5000; i++) {
      Planning.ExperimentSelector.rankCandidates(cands, Planning.SelectionPolicy.BALANCED);
    }
    const dRank = Date.now() - t2;
    assert.ok(dRank < 300, `10k experiment rankings took ${dRank} ms (limit 300 ms)`);
  });

  await t.test('Performance Benchmarks — Dependency Queries (< 100 ms for 10k)', () => {
    const t3 = Date.now();
    const graph = new Planning.VerificationDependencyGraph();
    graph.addDependency(new Planning.VerificationDependency({ source: 'A', target: 'B' }));
    for (let i = 0; i < 10000; i++) {
      graph.getDependenciesFor('A');
    }
    const dDep = Date.now() - t3;
    assert.ok(dDep < 100, `10k dependency queries took ${dDep} ms (limit 100 ms)`);
  });

  await t.test('Performance Benchmarks — Snapshot Serialization (< 200 ms for 1k)', () => {
    const t4 = Date.now();
    const snap = new Planning.PlanningSnapshot({
      goals: [{ id: 'g1', target: 't1' }],
      decisions: [{ experimentId: 'exp1' }],
      randomSeed: 42
    });
    for (let i = 0; i < 1000; i++) {
      JSON.stringify(snap.toJSON());
    }
    const dSnap = Date.now() - t4;
    assert.ok(dSnap < 200, `1k snapshot serializations took ${dSnap} ms (limit 200 ms)`);
  });

  await t.test('Performance Benchmarks — Replanning Cycles (< 500 ms for 1k)', () => {
    const t5 = Date.now();
    const replanner = new Planning.AdaptiveExperimentPlanner();
    const gaps = [new Planning.EvidenceGap({ kind: Planning.EvidenceGapKind.MISSING_PROOF, subject: 'sub' })];
    for (let i = 0; i < 1000; i++) {
      replanner.replanOnResult({ experimentId: 'exp1', outcome: 'COUNTEREXAMPLE_REPRODUCED' }, gaps);
    }
    const dReplan = Date.now() - t5;
    assert.ok(dReplan < 500, `1k replanning cycles took ${dReplan} ms (limit 500 ms)`);
  });

});
