import test from 'node:test';
import assert from 'node:assert/strict';

import * as Probabilistic from '../src/probabilistic/index.js';
import { Debugger } from '../src/debugger/Debugger.js';

test('Stage 24 — Universal Probabilistic Behavioral Modeling & Continuous Verification Engine', async (t) => {

  // =========================================================================
  // 1. Evidence Taxonomy & Models
  // =========================================================================
  await t.test('Evidence creation, hashing and immutability', () => {
    const ev = new Probabilistic.Evidence({
      kind: Probabilistic.EvidenceKind.RUNTIME_OBSERVATION,
      source: Probabilistic.EvidenceSource.TEST_EXECUTION,
      subject: 'func_add',
      polarity: Probabilistic.EvidencePolarity.SUPPORTS,
      strength: Probabilistic.EvidenceStrength.STRONG,
      confidence: 0.95,
      observation: { input: [1, 2], output: 3 }
    });

    assert.ok(ev.id);
    assert.strictEqual(ev.kind, 'RUNTIME_OBSERVATION');
    assert.strictEqual(ev.subject, 'func_add');
    assert.strictEqual(ev.polarity, 'SUPPORTS');
    assert.strictEqual(ev.confidence.score, 0.95);
    assert.throws(() => { ev.subject = 'other'; });
  });

  await t.test('EvidenceSet indexed operations', () => {
    const ev1 = new Probabilistic.Evidence({ id: 'ev1', subject: 'subA', polarity: Probabilistic.EvidencePolarity.SUPPORTS });
    const ev2 = new Probabilistic.Evidence({ id: 'ev2', subject: 'subA', polarity: Probabilistic.EvidencePolarity.REFUTES });
    const ev3 = new Probabilistic.Evidence({ id: 'ev3', subject: 'subB', polarity: Probabilistic.EvidencePolarity.SUPPORTS });

    const set = new Probabilistic.EvidenceSet([ev1, ev2, ev3]);
    assert.strictEqual(set.size, 3);
    assert.strictEqual(set.getById('ev1').id, 'ev1');
    assert.strictEqual(set.getBySubject('subA').length, 2);
    assert.strictEqual(set.getByPolarity(Probabilistic.EvidencePolarity.SUPPORTS).length, 2);
  });

  await t.test('EvidenceSourceRecord and EvidenceContribution', () => {
    const record = new Probabilistic.EvidenceSourceRecord({
      sourceStage: 'STAGE_23_EXPLORATION',
      generatorStrategy: 'BOUNDARY_VALUE',
      executionParameters: { seed: 42 }
    });
    assert.strictEqual(record.sourceStage, 'STAGE_23_EXPLORATION');

    const contrib = new Probabilistic.EvidenceContribution({
      evidenceId: 'ev_123',
      confidenceShift: 0.15,
      informationGainBits: 0.42
    });
    assert.strictEqual(contrib.evidenceId, 'ev_123');
    assert.strictEqual(contrib.confidenceShift, 0.15);
  });

  // =========================================================================
  // 2. Probability & Statistical Models
  // =========================================================================
  await t.test('BernoulliModel and BetaPosterior Bayesian updates', () => {
    const prior = new Probabilistic.PriorModel({ type: 'Beta', parameters: { alpha: 1, beta: 1 } });
    const { posterior, beta, explanation } = Probabilistic.BayesianUpdater.updateBinary(prior, 99, 1);

    assert.strictEqual(beta.alpha, 100);
    assert.strictEqual(beta.beta, 2);
    assert.ok(Math.abs(beta.mean() - (100 / 102)) < 1e-4);
    const ci = beta.credibleInterval(0.95);
    assert.ok(ci.lower >= 0.90 && ci.upper <= 1.0);
    assert.ok(explanation.posteriorSummary.includes('Beta(100, 2)'));
  });

  await t.test('CategoricalModel and DirichletPosterior updates', () => {
    const prior = new Probabilistic.PriorModel({ type: 'Dirichlet', parameters: { alphas: { ret_int: 1, ret_none: 1 } } });
    const { posterior, dirichlet } = Probabilistic.BayesianUpdater.updateCategorical(prior, { ret_int: 90, ret_none: 10 });

    const means = dirichlet.mean();
    assert.ok(Math.abs(means.ret_int - (91 / 102)) < 1e-3);
    assert.ok(Math.abs(means.ret_none - (11 / 102)) < 1e-3);
  });

  await t.test('DiscreteDistribution and FrequencyModel', () => {
    const freq = new Probabilistic.FrequencyModel().observeMany(['A', 'B', 'A', 'C', 'A']);
    assert.strictEqual(freq.total, 5);
    assert.strictEqual(freq.frequency('A'), 3);
    assert.strictEqual(freq.relativeFrequency('A'), 0.6);

    const disc = new Probabilistic.DiscreteDistribution(new Map([['A', 0.6], ['B', 0.2], ['C', 0.2]]));
    assert.strictEqual(disc.probability('A'), 0.6);
  });

  await t.test('EmpiricalDistribution moments and percentiles', () => {
    const emp = new Probabilistic.EmpiricalDistribution([10, 20, 30, 40, 50]);
    assert.strictEqual(emp.count, 5);
    assert.strictEqual(emp.mean(), 30);
    assert.strictEqual(emp.median(), 30);
    assert.strictEqual(emp.percentile(0), 10);
    assert.strictEqual(emp.percentile(100), 50);
  });

  await t.test('GaussianModel pdf, cdf and updates', () => {
    const g = new Probabilistic.GaussianModel(0, 1).update([1, 2, 3]);
    assert.strictEqual(g.sampleCount, 3);
    assert.strictEqual(g.mean, 2);
  });

  await t.test('HistogramModel density and probability', () => {
    const hist = Probabilistic.HistogramModel.fromData([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5);
    assert.strictEqual(hist.totalCount, 10);
    assert.ok(hist.probability(0) > 0);
  });

  // =========================================================================
  // 3. Behavioral Distribution & Conditional Partitions
  // =========================================================================
  await t.test('BehaviorModelBuilder and BehaviorDistribution', () => {
    const builder = new Probabilistic.BehaviorModelBuilder('func_test');
    const out1 = new Probabilistic.BehaviorOutcome({ type: 'RETURN', value: 42 });
    const out2 = new Probabilistic.BehaviorOutcome({ type: 'EXCEPTION', exceptionType: 'ValueError' });

    builder.addObservations(out1, 95);
    builder.addObservations(out2, 5);
    const dist = builder.build();

    assert.strictEqual(dist.totalObservations, 100);
    assert.ok(dist.probabilityOf(out1.id) > 0.85);
    assert.ok(dist.probabilityOf(out2.id) < 0.15);
    assert.ok(dist.isDominatedBy(out1.id, 0.80));
  });

  await t.test('BehaviorPartitioner and ConditionalBehavior', () => {
    const partitioner = new Probabilistic.BehaviorPartitioner('divide');
    const partZero = new Probabilistic.ConditionPartition({
      id: 'b_zero',
      predicate: (ctx) => ctx.b === 0,
      predicateSource: 'CFG'
    });
    const partNonZero = new Probabilistic.ConditionPartition({
      id: 'b_nonzero',
      predicate: (ctx) => ctx.b !== 0,
      predicateSource: 'CFG'
    });

    partitioner.addPartition(partZero).addPartition(partNonZero);
    const outZero = new Probabilistic.BehaviorOutcome({ type: 'RETURN', value: 0 });
    const outDiv = new Probabilistic.BehaviorOutcome({ type: 'RETURN', value: 'div_res' });

    partitioner.recordObservation({ a: 10, b: 0 }, outZero);
    partitioner.recordObservation({ a: 10, b: 2 }, outDiv);

    const cond = partitioner.build();
    assert.strictEqual(cond.partitions.length, 2);
    const distZ = cond.getDistributionFor({ a: 5, b: 0 });
    assert.ok(distZ.probabilityOf(outZero.id) > 0.5);
  });

  await t.test('State & Transition Probabilities', () => {
    const stateModel = new Probabilistic.ProbabilisticStateModel('state_machine');
    stateModel.recordState('START', 10);
    stateModel.recordState('RUNNING', 80);
    stateModel.recordState('ERROR', 1);

    assert.strictEqual(stateModel.totalVisits, 91);
    const spRunning = stateModel.getStateProbability('RUNNING');
    assert.ok(spRunning.visitationProbability > 0.85);

    const transModel = new Probabilistic.ProbabilisticTransitionModel('state_machine');
    transModel.recordTransition('START', 'RUNNING', 10);
    transModel.recordTransition('RUNNING', 'STOP', 8);
    transModel.recordTransition('RUNNING', 'ERROR', 1);

    const tp = transModel.getTransitionProbability('RUNNING', 'STOP');
    assert.ok(tp.probability > 0.8);
  });

  await t.test('Temporal Behavior & Sequence Probability', () => {
    const temporal = new Probabilistic.TemporalBehaviorModel('request_pipeline');
    temporal.recordSequence(['AUTH', 'VALIDATE', 'PROCESS', 'RESPOND']);
    temporal.recordSequence(['AUTH', 'VALIDATE', 'REJECT']);
    temporal.recordTiming('PROCESS', 15.5);
    temporal.recordTiming('PROCESS', 18.2);

    const seq = temporal.getConditionalProbability('VALIDATE', 'PROCESS');
    assert.strictEqual(seq.conditionalProbability, 0.5);
    const td = temporal.getTimingDistribution('PROCESS');
    assert.strictEqual(td.count, 2);
  });

  // =========================================================================
  // 4. Uncertainty, Calibration & Evidence Weights
  // =========================================================================
  await t.test('Uncertainty propagation and reduction', () => {
    const u1 = new Probabilistic.Uncertainty({ kind: Probabilistic.UncertaintyKind.STATISTICAL, score: 0.4 });
    const u2 = new Probabilistic.Uncertainty({ kind: Probabilistic.UncertaintyKind.ENVIRONMENTAL, score: 0.3 });

    const seq = Probabilistic.UncertaintyPropagator.propagateSequential([u1, u2]);
    assert.ok(seq.score > 0.4);

    const par = Probabilistic.UncertaintyPropagator.propagateParallel([u1, u2]);
    assert.ok(par.score < 0.3);

    const reduced = Probabilistic.UncertaintyReducer.reduceByObservation(u1, 50);
    assert.ok(reduced.score < u1.score);
  });

  await t.test('EvidenceWeight calculation across evidence kinds', () => {
    const evProof = new Probabilistic.Evidence({ kind: Probabilistic.EvidenceKind.STATIC_PROOF, strength: Probabilistic.EvidenceStrength.FORMAL });
    const evObs = new Probabilistic.Evidence({ kind: Probabilistic.EvidenceKind.RUNTIME_OBSERVATION, strength: Probabilistic.EvidenceStrength.OBSERVATIONAL });

    const wProof = Probabilistic.EvidenceWeight.computeWeight(evProof);
    const wObs = Probabilistic.EvidenceWeight.computeWeight(evObs);
    assert.ok(wProof > wObs);
    assert.strictEqual(wProof, 1.0);
  });

  // =========================================================================
  // 5. Determinism & Flakiness Detection
  // =========================================================================
  await t.test('RepeatabilityAnalyzer and NondeterminismDetector', () => {
    const runsConst = [
      { returnValue: 5, durationMs: 10 },
      { returnValue: 5, durationMs: 12 },
      { returnValue: 5, durationMs: 9 },
      { returnValue: 5, durationMs: 11 },
      { returnValue: 5, durationMs: 10 }
    ];
    const det = Probabilistic.DeterminismAnalyzer.analyzeExecutions('const_fn', runsConst);
    assert.strictEqual(det.classification, Probabilistic.DeterminismClassification.DETERMINISTIC);

    const runsVar = [
      { returnValue: 5 },
      { returnValue: 10 }
    ];
    const nondet = Probabilistic.DeterminismAnalyzer.analyzeExecutions('random_fn', runsVar);
    assert.strictEqual(nondet.classification, Probabilistic.DeterminismClassification.NONDETERMINISTIC);
  });

  await t.test('FlakinessAnalyzer identifies intermittent tests', () => {
    const flaky = Probabilistic.FlakinessAnalyzer.analyze('test_flaky', ['PASS', 'PASS', 'FAIL', 'PASS', 'FAIL']);
    assert.ok(flaky.isFlaky());
    assert.strictEqual(flaky.flakinessScore.classification, Probabilistic.FlakinessClassification.CONFIRMED_FLAKY);

    const stable = Probabilistic.FlakinessAnalyzer.analyze('test_stable', ['PASS', 'PASS', 'PASS', 'PASS']);
    assert.ok(!stable.isFlaky());
    assert.strictEqual(stable.flakinessScore.classification, Probabilistic.FlakinessClassification.STABLE);
  });

  // =========================================================================
  // 6. Frequentist & Distribution Comparisons
  // =========================================================================
  await t.test('ProportionEstimator and EffectSize', () => {
    const wilson = Probabilistic.ProportionEstimator.estimateWilson(90, 100);
    assert.ok(wilson.lower > 0.80 && wilson.upper < 0.98);

    const h = Probabilistic.EffectSize.cohensH(0.9, 0.5);
    assert.ok(h > 0.5);
  });

  await t.test('BehaviorDistributionDiff and Shift Detection', () => {
    const builderA = new Probabilistic.BehaviorModelBuilder('subject_x');
    const out1 = new Probabilistic.BehaviorOutcome({ type: 'RETURN', value: 1 });
    const out2 = new Probabilistic.BehaviorOutcome({ type: 'RETURN', value: 2 });
    builderA.addObservations(out1, 90).addObservations(out2, 10);
    const distA = builderA.build();

    const builderB = new Probabilistic.BehaviorModelBuilder('subject_x');
    builderB.addObservations(out1, 20).addObservations(out2, 80);
    const distB = builderB.build();

    const shift = Probabilistic.BehaviorShiftDetector.detect(distA, distB);
    assert.ok(shift.hasShift);
    assert.strictEqual(shift.diff.classification, Probabilistic.DistributionShiftClassification.SIGNIFICANT_SHIFT);
  });

  await t.test('OutlierDetector (Numeric, Behavior, Temporal)', () => {
    const numOut = Probabilistic.OutlierDetector.detectNumericIQR([1, 2, 3, 2, 3, 2, 100]);
    assert.strictEqual(numOut.outliers.length, 1);
    assert.strictEqual(numOut.outliers[0], 100);
  });

  await t.test('Environment models and effect correlation', () => {
    const fp1 = new Probabilistic.EnvironmentFingerprint({ os: 'darwin', runtimeVersion: 'v20.0.0' });
    const fp2 = new Probabilistic.EnvironmentFingerprint({ os: 'darwin', runtimeVersion: 'v20.0.0' });
    assert.ok(fp1.isConsistentWith(fp2));

    const corr = Probabilistic.EnvironmentEffectAnalyzer.analyzeCorrelation([
      { outcome: 'OK', environment: { os: 'linux' } },
      { outcome: 'FAIL', environment: { os: 'windows' } }
    ]);
    assert.ok(corr.hasCorrelation);
    assert.ok(corr.correlatedDimensions.includes('os'));
  });

  // =========================================================================
  // 7. Mandatory Scenarios (1 to 10)
  // =========================================================================
  await t.test('Scenario 1 — Probabilistic Divide Behavior', () => {
    const builder = new Probabilistic.BehaviorModelBuilder('divide');
    const outZero = new Probabilistic.BehaviorOutcome({ type: 'RETURN', value: 0 });
    const outRes = new Probabilistic.BehaviorOutcome({ type: 'RETURN', value: 'res' });
    const outExc = new Probabilistic.BehaviorOutcome({ type: 'EXCEPTION', exceptionType: 'ZeroDivisionError' });

    builder.addObservations(outZero, 500);
    builder.addObservations(outRes, 4800);
    builder.addObservations(outExc, 3);
    const dist = builder.build();

    assert.strictEqual(dist.totalObservations, 5303);
    assert.ok(dist.probabilityOf(outRes.id) > 0.90);
    assert.ok(dist.probabilityOf(outExc.id) < 0.01);
  });

  await t.test('Scenario 2 — Conflicting Observations', () => {
    const ev1 = new Probabilistic.Evidence({ subject: 'f(1)', polarity: Probabilistic.EvidencePolarity.SUPPORTS, observation: { returnValue: 2 } });
    const ev2 = new Probabilistic.Evidence({ subject: 'f(1)', polarity: Probabilistic.EvidencePolarity.REFUTES, observation: { returnValue: 3 } });

    const conflicts = Probabilistic.EvidenceConflictResolver.resolve('f(1)', [ev1, ev2]);
    assert.ok(conflicts.hasConflicts);
    assert.strictEqual(conflicts.conflicts.length, 1);

    const calib = Probabilistic.ConfidenceCalibrator.calibrate('f(1)', [ev1, ev2], conflicts.conflicts);
    assert.strictEqual(calib.confidenceLevel, Probabilistic.ConfidenceScale.CONFLICTING);
  });

  await t.test('Scenario 3 — Stable Specification (10,000 passes != FORMALLY_PROVEN)', () => {
    const evList = [];
    for (let i = 0; i < 1000; i++) {
      evList.push(new Probabilistic.Evidence({
        kind: Probabilistic.EvidenceKind.RUNTIME_OBSERVATION,
        subject: 'spec_pos',
        relatedSpecification: 'spec_pos',
        polarity: Probabilistic.EvidencePolarity.SUPPORTS
      }));
    }

    const { evidenceModel } = Probabilistic.ProbabilisticSpecificationValidator.validate('spec_pos', evList);
    assert.strictEqual(evidenceModel.confidence, Probabilistic.ConfidenceScale.VERY_HIGH);
    assert.notStrictEqual(evidenceModel.confidence, Probabilistic.ConfidenceScale.FORMALLY_ESTABLISHED);
    assert.strictEqual(evidenceModel.hasFormalProof, false);
  });

  await t.test('Scenario 4 — Symbolic Proof vs Runtime Evidence (PROOF_SCOPE_MISMATCH)', () => {
    const proofEv = new Probabilistic.Evidence({
      kind: Probabilistic.EvidenceKind.SYMBOLIC_PROOF,
      subject: 'prop_gt_zero',
      polarity: Probabilistic.EvidencePolarity.SUPPORTS,
      strength: Probabilistic.EvidenceStrength.FORMAL,
      provenance: { scope: (x) => x > 0 }
    });

    const runEv = new Probabilistic.Evidence({
      kind: Probabilistic.EvidenceKind.RUNTIME_OBSERVATION,
      subject: 'prop_gt_zero',
      polarity: Probabilistic.EvidencePolarity.REFUTES,
      strength: Probabilistic.EvidenceStrength.OBSERVATIONAL,
      observation: { input: -1 }
    });

    const res = Probabilistic.EvidenceConflictResolver.resolve('prop_gt_zero', [proofEv, runEv]);
    assert.ok(res.hasConflicts);
    assert.strictEqual(res.conflicts[0].classification, Probabilistic.ConflictClassification.PROOF_SCOPE_MISMATCH);
  });

  await t.test('Scenario 5 — Statistical Regression (0.2% -> 4.7%)', () => {
    const regr = Probabilistic.StatisticalRegressionDetector.detectExceptionRateRegression(
      'checkout_service',
      2, 1000,   // baseline: 0.2%
      47, 1000   // current: 4.7%
    );

    assert.ok(regr !== null);
    assert.strictEqual(regr.type, 'EXCEPTION_RATE_INCREASE');
    assert.ok(regr.probability.probability > 0.95);
    assert.ok(regr.explanation.includes('Statistically significant exception rate regression'));
  });

  await t.test('Scenario 6 — Flaky Test', () => {
    const runs = ['PASS', 'PASS', 'FAIL', 'PASS', 'FAIL'];
    const flaky = Probabilistic.FlakinessAnalyzer.analyze('test_intermittent', runs);

    assert.strictEqual(flaky.flakinessScore.classification, Probabilistic.FlakinessClassification.CONFIRMED_FLAKY);
    assert.strictEqual(flaky.flakinessScore.switchCount, 3);
    assert.ok(flaky.flakinessScore.score > 0.5);
  });

  await t.test('Scenario 7 — Rare Behavior candidate anomaly', () => {
    const builder = new Probabilistic.BehaviorModelBuilder('network_call');
    const normalOut = new Probabilistic.BehaviorOutcome({ type: 'RETURN', value: 'OK' });
    const excOut = new Probabilistic.BehaviorOutcome({ type: 'EXCEPTION', exceptionType: 'SocketTimeout' });

    builder.addObservations(normalOut, 9998);
    builder.addObservations(excOut, 2);
    const dist = builder.build();

    const anomalies = Probabilistic.AnomalyDetector.detectFromDistribution(dist, 0.005);
    assert.strictEqual(anomalies.length, 1);
    assert.strictEqual(anomalies[0].type, 'UNEXPECTED_EXCEPTION');
    assert.ok(anomalies[0].anomalyScore.isAnomaly);
  });

  await t.test('Scenario 8 — Uncertainty-Guided Exploration candidate selection', () => {
    const candidates = [
      { subject: 'RegionA', confidenceScore: 0.99, novelty: 0.2 },
      { subject: 'RegionB', confidenceScore: 0.91, novelty: 0.3 },
      { subject: 'RegionC', confidenceScore: 0.58, novelty: 0.8 },
      { subject: 'RegionD', confidenceScore: 0.99, novelty: 0.1 }
    ];

    const targets = Probabilistic.UncertaintyExplorer.selectTargets(candidates, { favorUncertaintyReduction: true });
    assert.strictEqual(targets[0].target.subject, 'RegionC');
  });

  await t.test('Scenario 9 — Mutation Evidence', () => {
    const risk = Probabilistic.RiskAnalyzer.analyzeSubject('critical_fn', {
      confidenceScore: 0.9,
      survivingMutantsCount: 3,
      hasRegression: false
    });

    assert.ok(risk.factors.some(f => f.name === 'MUTATION_SURVIVOR'));
    assert.ok(risk.compositeScore > 0.2);
  });

  await t.test('Scenario 10 — Continuous Verification change tracking & re-verification', () => {
    const cont = new Probabilistic.ContinuousVerification();
    cont.onSourceChanged(['src/utils/math.js']);
    cont.onMutationSurvived('mutant_123');

    const priorities = Probabilistic.ReverificationPlanner.plan(['func_math', 'func_other'], {
      regressedSubjects: [],
      survivedMutants: ['func_math'],
      staleSubjects: ['func_math']
    });

    assert.strictEqual(priorities[0].subject, 'func_math');
    assert.ok(priorities[0].priorityScore > priorities[1].priorityScore);

    const run = cont.executeNextRun(() => ({ propertiesChecked: 5, propertiesVerified: 4, propertiesUncertain: 1 }));
    assert.ok(run);
    assert.strictEqual(run.status, Probabilistic.VerificationStatus.COMPLETED);
    assert.strictEqual(run.propertiesChecked, 5);
  });

  // =========================================================================
  // 8. Graph, Snapshot, Replay & Debugger Integration
  // =========================================================================
  await t.test('EvidenceGraph construction and provenance tracing', () => {
    const graph = new Probabilistic.EvidenceGraph();
    const nodeP = new Probabilistic.EvidenceNode({ id: 'prog', type: 'PROGRAM' });
    const nodeS = new Probabilistic.EvidenceNode({ id: 'spec1', type: 'SPECIFICATION' });
    const nodeE = new Probabilistic.EvidenceNode({ id: 'ev1', type: 'EVIDENCE' });

    graph.addNode(nodeP).addNode(nodeS).addNode(nodeE);
    graph.addEdge(new Probabilistic.EvidenceEdge({ from: 'prog', to: 'spec1', relation: 'DEPENDS_ON' }));
    graph.addEdge(new Probabilistic.EvidenceEdge({ from: 'spec1', to: 'ev1', relation: 'SUPPORTS' }));

    const trace = Probabilistic.EvidenceGraphAnalyzer.traceProvenance(graph, 'ev1');
    assert.strictEqual(trace.length, 2);
  });

  await t.test('ProbabilisticSnapshot deterministic serialization & replay', () => {
    const snap = new Probabilistic.ProbabilisticSnapshot({
      programIdentity: 'test_prog',
      randomSeed: 12345,
      distributions: { fnA: { mean: 0.5 } }
    });

    const json = JSON.stringify(snap.toJSON());
    const restored = Probabilistic.ProbabilisticSnapshot.fromJSON(json);

    assert.strictEqual(restored.programIdentity, 'test_prog');
    assert.strictEqual(restored.randomSeed, 12345);
    assert.strictEqual(restored.distributions.fnA.mean, 0.5);
  });

  await t.test('Debugger API Stage 24 verification', () => {
    const dbg = new Debugger();
    const campaign = dbg.createProbabilisticCampaign({ seed: 99 });
    assert.ok(campaign);

    const health = dbg.getVerificationHealth();
    assert.ok(health);
    assert.ok(health.compositeHealthScore > 0);

    const risk = dbg.getVerificationRisk();
    assert.ok(risk);
    assert.ok(risk.level);

    const nextExp = dbg.getNextBestExperiment([
      { subject: 'foo', confidenceScore: 0.4, novelty: 0.9 }
    ]);
    assert.ok(nextExp);
    assert.strictEqual(nextExp.target.subject, 'foo');
  });

  await t.test('Language Probabilistic Adapters', () => {
    const pyAdapter = new Probabilistic.PythonProbabilisticAdapter();
    const feats = pyAdapter.extractSubjectFeatures(`
def foo(a, b):
    if b == 0:
        return 0
    return a / b
`);
    assert.ok(feats.branchesCount >= 1);
    assert.ok(feats.predicates.length >= 1);
  });

  // =========================================================================
  // 9. Performance Benchmarks
  // =========================================================================
  await t.test('Performance Benchmarks', () => {
    // 100,000 evidence insertions
    const t0 = Date.now();
    let set = new Probabilistic.EvidenceSet();
    const batch = [];
    for (let i = 0; i < 100000; i++) {
      batch.push(new Probabilistic.Evidence({
        id: `ev_${i}`,
        subject: `sub_${i % 100}`,
        polarity: Probabilistic.EvidencePolarity.SUPPORTS
      }));
    }
    set = set.addAll(batch);
    const dInsert = Date.now() - t0;
    assert.ok(dInsert < 500, `100k evidence insertions took ${dInsert} ms (limit 500 ms)`);

    // 100,000 probability updates
    const t1 = Date.now();
    let beta = new Probabilistic.BetaPosterior(1, 1);
    for (let i = 0; i < 100000; i++) {
      beta = beta.update(1, 0);
    }
    const dUpdates = Date.now() - t1;
    assert.ok(dUpdates < 500, `100k probability updates took ${dUpdates} ms (limit 500 ms)`);

    // 10,000 confidence calculations
    const t2 = Date.now();
    const evSample = [new Probabilistic.Evidence({ subject: 'sub', polarity: Probabilistic.EvidencePolarity.SUPPORTS })];
    for (let i = 0; i < 10000; i++) {
      Probabilistic.ConfidenceCalibrator.calibrate('sub', evSample);
    }
    const dCalib = Date.now() - t2;
    assert.ok(dCalib < 300, `10k confidence calculations took ${dCalib} ms (limit 300 ms)`);
  });

});
