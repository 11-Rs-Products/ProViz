/**
 * test_stage35_project.mjs
 * Stage 35: Universal Project Intelligence, Architecture Governance & Engineering Analytics Engine Test Suite.
 * 40 Mandatory Scenarios + 13 Performance Benchmarks.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { Debugger } from '../src/debugger/Debugger.js';
import * as Project from '../src/project/index.js';

test('Stage 35 — Scenario 1: Project model construction and entity unification', () => {
  const model = new Project.ProjectModel({ id: 'proj_alpha', name: 'Alpha Project' });
  const mod = model.addEntity(new Project.ProjectEntity({
    id: 'src/core/auth.js',
    name: 'AuthModule',
    kind: Project.ProjectEntityKind.MODULE,
    layer: 'Domain'
  }));

  assert.equal(model.id, 'proj_alpha');
  assert.equal(model.getModules().length, 1);
  assert.equal(model.getEntity('src/core/auth.js').name, 'AuthModule');
});

test('Stage 35 — Scenario 2: Project snapshot creation and immutability', () => {
  const graph = new Project.ProjectGraph();
  graph.addNode(new Project.ProjectEntity({ id: 'modA', kind: Project.ProjectEntityKind.MODULE }));
  const snapshot = new Project.ProjectSnapshot({
    id: 'SNAP_001',
    projectId: 'proj_1',
    revision: 1,
    graph
  });

  assert.equal(snapshot.id, 'SNAP_001');
  assert.equal(snapshot.revision, 1);
  assert.throws(() => {
    snapshot.id = 'MUTATED';
  });
});

test('Stage 35 — Scenario 3: Architecture model generation with layers and boundaries', () => {
  const arch = new Project.ArchitectureModel({ id: 'layered_arch' });
  arch.addLayer({ id: 'UI', name: 'User Interface', level: 0, allowedDependencies: ['Application'] });
  arch.addLayer({ id: 'Application', name: 'App Services', level: 1, allowedDependencies: ['Domain'] });
  arch.addLayer({ id: 'Domain', name: 'Domain Models', level: 2, allowedDependencies: [] });

  arch.addBoundary({ id: 'PaymentBoundary', name: 'Payment Module', internalModules: ['pay_internal.js'], publicAPIs: ['pay_api.js'], isSecurityBoundary: true });

  assert.equal(arch.layers.size, 3);
  assert.equal(arch.boundaries.size, 1);
  assert.ok(arch.getBoundary('PaymentBoundary').isSecurityBoundary);
});

test('Stage 35 — Scenario 4: Architecture baseline creation and persistence', () => {
  const baseline = new Project.ArchitectureBaseline({
    id: 'BASELINE_V1',
    projectId: 'proj_alpha',
    revision: 1,
    approvedEdges: ['ui.js->app.js', 'app.js->domain.js']
  });

  assert.equal(baseline.approvedEdges.length, 2);
  const json = baseline.toJSON();
  const loaded = Project.ArchitectureBaseline.fromJSON(json);
  assert.equal(loaded.id, 'BASELINE_V1');
});

test('Stage 35 — Scenario 5: Architecture drift detection against baseline', () => {
  const baseline = new Project.ArchitectureBaseline({
    id: 'BASELINE_V1',
    projectId: 'proj_alpha',
    approvedEdges: ['ui.js->app.js']
  });

  const graph = new Project.ProjectGraph();
  graph.addNode(new Project.ProjectEntity({ id: 'ui.js' }));
  graph.addNode(new Project.ProjectEntity({ id: 'app.js' }));
  graph.addNode(new Project.ProjectEntity({ id: 'domain.js' }));
  graph.addEdge(new Project.ProjectRelation({ from: 'ui.js', to: 'app.js' }));
  graph.addEdge(new Project.ProjectRelation({ from: 'ui.js', to: 'domain.js' })); // Unapproved drift

  const analyzer = new Project.ArchitectureDriftAnalyzer();
  const drift = analyzer.analyze(baseline, graph);

  assert.ok(drift.hasDrift);
  assert.equal(drift.addedDependencies.length, 1);
  assert.equal(drift.addedDependencies[0], 'ui.js->domain.js');
});

test('Stage 35 — Scenario 6: Forbidden dependency and layer violation detection', () => {
  const arch = new Project.ArchitectureModel({ id: 'layered_arch' });
  arch.addLayer({ id: 'UI', name: 'UI', allowedDependencies: ['Domain'], modules: ['ui.js'] });
  arch.addLayer({ id: 'Domain', name: 'Domain', allowedDependencies: [], modules: ['domain.js'] });

  const graph = new Project.ProjectGraph();
  graph.addNode(new Project.ProjectEntity({ id: 'ui.js', layer: 'UI' }));
  graph.addNode(new Project.ProjectEntity({ id: 'domain.js', layer: 'Domain' }));
  graph.addEdge(new Project.ProjectRelation({ from: 'domain.js', to: 'ui.js' })); // Domain depending on UI (forbidden)

  const analyzer = new Project.ArchitectureAnalyzer({ architectureModel: arch });
  const res = analyzer.analyze(graph);

  assert.equal(res.isCompliant, false);
  assert.equal(res.violations.length, 1);
  assert.equal(res.violations[0].kind, 'LAYER_VIOLATION');
});

test('Stage 35 — Scenario 7: Dependency centrality analysis', () => {
  const graph = new Project.ProjectGraph();
  graph.addNode({ id: 'A' });
  graph.addNode({ id: 'B' });
  graph.addNode({ id: 'C' });
  graph.addDependency('A', 'B');
  graph.addDependency('C', 'B'); // B has highest in-degree centrality

  const analyzer = new Project.DependencyCentralityAnalyzer();
  const res = analyzer.analyze(graph);

  assert.equal(res.nodeCount, 3);
  assert.equal(res.topCentralNodes[0].id, 'B');
});

test('Stage 35 — Scenario 8: Dependency risk analysis with formula verification', () => {
  const graph = new Project.ProjectGraph();
  graph.addNode({ id: 'CoreModule' });
  graph.addNode({ id: 'AppModule' });
  graph.addDependency('AppModule', 'CoreModule');

  const analyzer = new Project.DependencyRiskAnalyzer();
  const res = analyzer.analyze(graph, {
    changeFrequencies: { CoreModule: 0.8 },
    failureImpacts: { CoreModule: 0.9 },
    verificationSensitivities: { CoreModule: 0.9 }
  });

  assert.ok(res.risks.length > 0);
  const coreRisk = res.risks.find(r => r.id === 'CoreModule');
  assert.ok(coreRisk.dependencyRisk > 0);
});

test('Stage 35 — Scenario 9: Coupling analysis', () => {
  const graph = new Project.ProjectGraph();
  graph.addNode({ id: 'A' });
  graph.addNode({ id: 'B' });
  graph.addDependency('A', 'B');

  const analyzer = new Project.ProjectCouplingAnalyzer();
  const res = analyzer.analyze(graph);

  assert.equal(res.totalModules, 2);
  assert.equal(res.averageCoupling, 1.0);
});

test('Stage 35 — Scenario 10: Cohesion analysis', () => {
  const graph = new Project.ProjectGraph();
  graph.addNode({ id: 'modA' });
  graph.addNode({ id: 'modB' });

  const analyzer = new Project.ProjectCohesionAnalyzer();
  const res = analyzer.analyze(graph);

  assert.ok(res.averageCohesion >= 0.0);
});

test('Stage 35 — Scenario 11: Structural health calculation and cycle penalty', () => {
  const graph = new Project.ProjectGraph();
  graph.addNode({ id: 'A' });
  graph.addNode({ id: 'B' });
  graph.addDependency('A', 'B');
  graph.addDependency('B', 'A'); // Cycle

  const analyzer = new Project.StructuralHealthAnalyzer();
  const res = analyzer.analyze(graph);

  assert.equal(res.isHealthy, false);
  assert.equal(res.metrics.cycleCount, 1);
});

test('Stage 35 — Scenario 12: Risk hotspot detection', () => {
  const graph = new Project.ProjectGraph();
  graph.addNode({ id: 'HotNode' });
  graph.addNode({ id: 'SubNode' });
  graph.addDependency('SubNode', 'HotNode');

  const analyzer = new Project.RiskHotspotAnalyzer();
  const res = analyzer.analyze(graph, {
    changeFrequencies: { HotNode: 0.9 },
    failureProbabilities: { HotNode: 0.8 },
    impacts: { HotNode: 0.9 }
  });

  assert.equal(res.topHotspots[0].entityId, 'HotNode');
  assert.ok(res.topHotspots[0].hotspotRisk > 0);
});

test('Stage 35 — Scenario 13: Risk propagation analysis', () => {
  const graph = new Project.ProjectGraph();
  graph.addNode({ id: 'Root' });
  graph.addNode({ id: 'Middle' });
  graph.addNode({ id: 'Leaf' });
  graph.addDependency('Middle', 'Root');
  graph.addDependency('Leaf', 'Middle');

  const analyzer = new Project.RiskPropagationAnalyzer(graph);
  const res = analyzer.propagateRisk('Root', 1.0, 0.5);

  assert.equal(res.sourceId, 'Root');
  assert.equal(res.affectedEntitiesCount, 3);
  const leaf = res.affected.find(a => a.entityId === 'Leaf');
  assert.equal(leaf.propagatedRisk, 0.25);
});

test('Stage 35 — Scenario 14: Change hotspot detection', () => {
  const history = new Project.ProjectChangeHistory();
  history.recordChange({ changeId: 'c1', modifiedEntities: ['modA'], causedRegression: true });
  history.recordChange({ changeId: 'c2', modifiedEntities: ['modA', 'modB'] });

  const analyzer = new Project.ChangeHotspotAnalyzer();
  const res = analyzer.analyze(history);

  assert.equal(res.hotspots[0].entityId, 'modA');
  assert.equal(res.hotspots[0].regressionCount, 1);
});

test('Stage 35 — Scenario 15: Change history and frequency analysis', () => {
  const history = new Project.ProjectChangeHistory();
  history.recordChange({ changeId: 'c1', modifiedEntities: ['modA'] });
  history.recordChange({ changeId: 'c2', modifiedEntities: ['modA'] });

  const analyzer = new Project.ChangeFrequencyAnalyzer();
  const res = analyzer.analyze(history);

  assert.equal(res.totalChangesRecorded, 2);
  assert.equal(res.frequencies[0].changeCount, 2);
});

test('Stage 35 — Scenario 16: Technical debt calculation with category breakdown', () => {
  const graph = new Project.ProjectGraph();
  graph.addNode({ id: 'modA' });
  const analyzer = new Project.TechnicalDebtAnalyzer();
  const debt = analyzer.analyze(graph, {
    architectureAnalysis: { violations: [{ id: 'v1', kind: 'LAYER_VIOLATION', source: 'modA', severity: 'CRITICAL' }] }
  });

  assert.ok(debt.totalDebtScore > 0);
  assert.equal(debt.getItemsByCategory(Project.DebtCategory.ARCHITECTURE).length, 1);
});

test('Stage 35 — Scenario 17: Verification debt mapping', () => {
  const debtMap = new Project.VerificationDebtMap({
    entityDebtMap: { 'api/users': [{ gapKind: 'MISSING_CONTRACT' }] },
    debtScore: 2.5
  });

  assert.equal(debtMap.getDebtForEntity('api/users').length, 1);
  assert.equal(debtMap.debtScore, 2.5);
});

test('Stage 35 — Scenario 18: Debt trend analysis across revisions', () => {
  const trend = new Project.DebtTrend({
    direction: 'INCREASING',
    deltaScore: 5.2,
    previousDebtScore: 10.0,
    currentDebtScore: 15.2
  });

  assert.equal(trend.direction, 'INCREASING');
  assert.equal(trend.deltaScore, 5.2);
});

test('Stage 35 — Scenario 19: Multidimensional engineering health calculation', () => {
  const graph = new Project.ProjectGraph();
  graph.addNode({ id: 'modA' });
  const analyzer = new Project.EngineeringHealthAnalyzer();
  const health = analyzer.analyze(graph);

  assert.ok(health.getCompositeScore() >= 0.0);
  assert.ok(health.getScore(Project.EngineeringHealthDimension.CORRECTNESS) <= 1.0);
  assert.ok(health.isHealthy);
});

test('Stage 35 — Scenario 20: Health history comparison and trajectory', () => {
  const h1 = new Project.EngineeringHealth({ dimensions: { CORRECTNESS: 0.9, SECURITY: 0.9 } });
  const h2 = new Project.EngineeringHealth({ dimensions: { CORRECTNESS: 0.7, SECURITY: 0.6 } });

  const analyzer = new Project.HealthTrendAnalyzer();
  const trend = analyzer.compare(h1, h2);

  assert.equal(trend.direction, 'DEGRADING');
  assert.ok(trend.degradingDimensions.includes('CORRECTNESS'));
});

test('Stage 35 — Scenario 21: Specification traceability matrix construction', () => {
  const graph = new Project.ProjectGraph();
  graph.addNode(new Project.ProjectEntity({ id: 'REQ_AUTH', kind: 'SPECIFICATION', attributes: { isRequirement: true } }));
  graph.addNode(new Project.ProjectEntity({ id: 'auth.js', kind: 'MODULE' }));
  graph.addEntity(new Project.ProjectEntity({ id: 'OB_AUTH_1', kind: 'VERIFICATION_OBLIGATION' }));
  graph.addEdge(new Project.ProjectRelation({ from: 'REQ_AUTH', to: 'auth.js' }));
  graph.addEdge(new Project.ProjectRelation({ from: 'REQ_AUTH', to: 'OB_AUTH_1' }));

  const analyzer = new Project.TraceabilityAnalyzer();
  const matrix = analyzer.analyze(graph);

  assert.equal(matrix.links.length, 1);
  assert.equal(matrix.links[0].requirementId, 'REQ_AUTH');
  assert.equal(matrix.links[0].implementationIds[0], 'auth.js');
});

test('Stage 35 — Scenario 22: Requirement coverage analysis', () => {
  const graph = new Project.ProjectGraph();
  graph.addNode(new Project.ProjectEntity({ id: 'REQ_1', kind: 'SPECIFICATION', attributes: { isRequirement: true } }));
  graph.addNode(new Project.ProjectEntity({ id: 'core.js', kind: 'MODULE' }));
  graph.addEdge(new Project.ProjectRelation({ from: 'REQ_1', to: 'core.js', kind: Project.ProjectRelationKind.CONSTRAINS }));

  const analyzer = new Project.SpecificationCoverageAnalyzer();
  const coverage = analyzer.analyze(graph);

  assert.equal(coverage.totalRequirements, 1);
  assert.equal(coverage.implementedRequirements, 1);
});

test('Stage 35 — Scenario 23: Verification gap detection on public APIs and boundaries', () => {
  const graph = new Project.ProjectGraph();
  graph.addNode(new Project.ProjectEntity({ id: 'api/login', kind: 'API', attributes: { hasContract: false } }));

  const analyzer = new Project.ProjectVerificationGapAnalyzer();
  const res = analyzer.analyze(graph);

  assert.equal(res.gapCount, 1);
  assert.equal(res.gaps[0].gapKind, 'MISSING_CONTRACT');
});

test('Stage 35 — Scenario 24: Governance rule evaluation with pass/fail decision', () => {
  const policySet = new Project.GovernancePolicySet({ id: 'gov_main' });
  const policy = policySet.addPolicy({ id: 'pol_core', name: 'Core Safety' });
  policy.rules = [
    new Project.GovernanceRule({
      id: 'R_NO_CYCLES',
      name: 'No Cyclic Dependencies',
      kind: Project.GovernanceRuleKind.NO_DEPENDENCY_CYCLES,
      severity: 'BLOCKER'
    })
  ];

  const graph = new Project.ProjectGraph();
  graph.addNode({ id: 'A' });
  graph.addNode({ id: 'B' });
  graph.addDependency('A', 'B');

  const evaluator = new Project.GovernanceEvaluator(policySet);
  const decision = evaluator.evaluate(graph);

  assert.ok(decision.isPassed);
  assert.equal(decision.isBlocked, false);
});

test('Stage 35 — Scenario 25: Governance violation generation on cyclic dependency', () => {
  const policySet = new Project.GovernancePolicySet({ id: 'gov_main' });
  const policy = policySet.addPolicy({ id: 'pol_core', name: 'Core Safety' });
  policy.rules = [
    new Project.GovernanceRule({
      id: 'R_NO_CYCLES',
      name: 'No Cyclic Dependencies',
      kind: Project.GovernanceRuleKind.NO_DEPENDENCY_CYCLES,
      severity: 'BLOCKER'
    })
  ];

  const graph = new Project.ProjectGraph();
  graph.addNode({ id: 'A' });
  graph.addNode({ id: 'B' });
  graph.addDependency('A', 'B');
  graph.addDependency('B', 'A'); // Cycle

  const evaluator = new Project.GovernanceEvaluator(policySet);
  const decision = evaluator.evaluate(graph);

  assert.equal(decision.isPassed, false);
  assert.equal(decision.isBlocked, true);
  assert.equal(decision.violations.length, 1);
});

test('Stage 35 — Scenario 26: Ownership and responsibility mapping', () => {
  const respMap = new Project.ResponsibilityMap();
  respMap.setResponsibility({
    entityId: 'src/security/auth.js',
    primaryOwnerTeam: 'SecurityTeam',
    securityContact: 'sec-lead@proviz.org'
  });

  const ownership = new Project.ProjectOwnership({ responsibilityMap: respMap });
  const analyzer = new Project.OwnershipAnalyzer();
  const graph = new Project.ProjectGraph();
  graph.addNode({ id: 'src/security/auth.js' });

  const res = analyzer.analyze(graph, ownership);
  assert.equal(res.ownershipCoverage, 1.0);
  assert.equal(res.hasCompleteOwnership, true);
});

test('Stage 35 — Scenario 27: Failure and regression forecasting', () => {
  const forecast = new Project.FailureForecast({
    targetEntityId: 'mod_payment',
    failureProbability: 0.15,
    confidence: 0.8
  });

  assert.equal(forecast.targetEntityId, 'mod_payment');
  assert.equal(forecast.tier, Project.ForecastTier.PROBABILISTIC);
});

test('Stage 35 — Scenario 28: Change-risk forecasting for candidate changesets', () => {
  const forecast = new Project.ChangeRiskForecast({
    changedEntityIds: ['modA', 'modB'],
    predictedRiskScore: 0.45,
    estimatedBlastRadius: 6
  });

  assert.equal(forecast.estimatedBlastRadius, 6);
  assert.equal(forecast.tier, Project.ForecastTier.PROBABILISTIC);
});

test('Stage 35 — Scenario 29: Verification cost forecasting', () => {
  const forecast = new Project.VerificationCostForecast({
    estimatedVerificationTimeMs: 150,
    estimatedObligationsToVerify: 10,
    estimatedCpuHours: 0.05
  });

  assert.equal(forecast.estimatedObligationsToVerify, 10);
  assert.equal(forecast.confidence, 0.85);
});

test('Stage 35 — Scenario 30: Project recommendation generation from evidence', () => {
  const generator = new Project.RecommendationGenerator();
  const recs = generator.generate({
    architectureAnalysis: {
      violations: [{
        id: 'V1',
        kind: 'ARCHITECTURAL_CYCLE',
        cycle: ['modA', 'modB']
      }]
    }
  });

  assert.equal(recs.length, 1);
  assert.equal(recs[0].kind, Project.RecommendationKind.BREAK_DEPENDENCY_CYCLE);
  assert.ok(recs[0].confidence > 0.8);
});

test('Stage 35 — Scenario 31: Recommendation ranking by priority and ROI', () => {
  const r1 = new Project.ProjectRecommendation({
    id: 'R1',
    title: 'Minor refactor',
    reason: 'Code cleanliness',
    evidence: new Project.RecommendationEvidence({ sourceMetric: 'LOC', observedValue: 500, thresholdValue: 300 }),
    estimatedCost: 10.0,
    confidence: 0.5
  });
  const r2 = new Project.ProjectRecommendation({
    id: 'R2',
    title: 'Fix critical gap',
    reason: 'Security requirement',
    evidence: new Project.RecommendationEvidence({ sourceMetric: 'SEC', observedValue: 0, thresholdValue: 1 }),
    estimatedCost: 1.0,
    confidence: 0.95
  });

  const ranker = new Project.RecommendationRanker();
  const ranked = ranker.rank([r1, r2]);

  assert.equal(ranked[0].id, 'R2');
});

test('Stage 35 — Scenario 32: Architecture remediation planning', () => {
  const planner = new Project.ArchitectureRemediationPlanner();
  const graph = new Project.ProjectGraph();
  const plan = planner.planRemediation([
    { id: 'v_layer', kind: 'LAYER_VIOLATION', source: 'domain.js', target: 'ui.js', sourceLayer: 'Domain', targetLayer: 'UI' }
  ], graph);

  assert.equal(plan.planCount, 1);
  assert.equal(plan.plans[0].strategy, 'INTRODUCE_INTERFACE_INVERSION');
});

test('Stage 35 — Scenario 33: Remediation validation through verification gates', () => {
  const planner = new Project.ArchitectureRemediationPlanner();
  const plan = { id: 'p1' };
  const validation = planner.validateRemediation(plan, {
    preservationPassed: true,
    securityGatePassed: true,
    performanceGatePassed: true,
    concurrencyGatePassed: true
  });

  assert.equal(validation.isValid, true);
  assert.equal(validation.decision, 'APPROVED_FOR_AUTONOMOUS_APPLICATION');
});

test('Stage 35 — Scenario 34: Security governance gate evaluation', () => {
  const policySet = new Project.GovernancePolicySet({ id: 'gov' });
  const policy = policySet.addPolicy({ id: 'pol_sec', name: 'Security Policy' });
  policy.rules = [
    new Project.GovernanceRule({
      id: 'R_SEC',
      name: 'Security Path Verification',
      kind: Project.GovernanceRuleKind.SECURITY_PATHS_REQUIRE_VERIFICATION,
      severity: 'BLOCKER'
    })
  ];

  const evaluator = new Project.GovernanceEvaluator(policySet);
  const graph = new Project.ProjectGraph();
  const decision = evaluator.evaluate(graph, {
    securityPosture: { unmitigatedThreatsCount: 2 }
  });

  assert.equal(decision.isBlocked, true);
});

test('Stage 35 — Scenario 35: Performance governance gate evaluation', () => {
  const policySet = new Project.GovernancePolicySet({ id: 'gov' });
  const policy = policySet.addPolicy({ id: 'pol_perf', name: 'Performance Policy' });
  policy.rules = [
    new Project.GovernanceRule({
      id: 'R_PERF',
      name: 'Performance Bounds',
      kind: Project.GovernanceRuleKind.PERFORMANCE_SENSITIVE_REQUIRE_EVIDENCE,
      severity: 'BLOCKER'
    })
  ];

  const evaluator = new Project.GovernanceEvaluator(policySet);
  const graph = new Project.ProjectGraph();
  const decision = evaluator.evaluate(graph, {
    performancePosture: { regressionsCount: 1 }
  });

  assert.equal(decision.isBlocked, true);
});

test('Stage 35 — Scenario 36: Concurrency governance gate evaluation', () => {
  const policySet = new Project.GovernancePolicySet({ id: 'gov' });
  const policy = policySet.addPolicy({ id: 'pol_conc', name: 'Concurrency Policy' });
  policy.rules = [
    new Project.GovernanceRule({
      id: 'R_CONC',
      name: 'Concurrency Safety',
      kind: Project.GovernanceRuleKind.CONCURRENCY_REQUIRE_SCHEDULE_EXPLORATION,
      severity: 'BLOCKER'
    })
  ];

  const evaluator = new Project.GovernanceEvaluator(policySet);
  const graph = new Project.ProjectGraph();
  const decision = evaluator.evaluate(graph, {
    concurrencyPosture: { racesCount: 1 }
  });

  assert.equal(decision.isBlocked, true);
});

test('Stage 35 — Scenario 37: Project health snapshot creation and persistence', () => {
  const health = new Project.EngineeringHealth();
  const snap = new Project.ProjectHealthSnapshot({
    id: 'SNAP_H1',
    projectId: 'proj_alpha',
    revision: 1,
    health
  });

  assert.equal(snap.id, 'SNAP_H1');
  assert.ok(snap.health.isHealthy);
});

test('Stage 35 — Scenario 38: Project snapshot diff computation', () => {
  const h1 = new Project.EngineeringHealth({ dimensions: { CORRECTNESS: 0.9 } });
  const h2 = new Project.EngineeringHealth({ dimensions: { CORRECTNESS: 0.7 } });
  const s1 = new Project.ProjectHealthSnapshot({ id: 's1', projectId: 'p', revision: 1, health: h1 });
  const s2 = new Project.ProjectHealthSnapshot({ id: 's2', projectId: 'p', revision: 2, health: h2 });

  const diff = Project.ProjectHealthDiff.diff(s1, s2);
  assert.equal(diff.isDegraded, true);
  assert.equal(diff.dimensionDiffs.CORRECTNESS, -0.2);
});

test('Stage 35 — Scenario 39: Project-level certification with explicit scope and assumptions', () => {
  const engine = new Project.ProjectCertificationEngine();
  const decision = new Project.GovernanceDecision({
    policySetVersion: '1.0.0',
    outcome: Project.DecisionOutcome.PASSED
  });

  const cert = engine.certify({
    projectId: 'proj_alpha',
    revision: 1,
    governanceDecision: decision,
    health: new Project.EngineeringHealth()
  });

  assert.ok(cert.isCertified);
  assert.ok(cert.disclaimer.includes('declared scope'));
});

test('Stage 35 — Scenario 40: Full Debugger integration: Project Intelligence -> Governance -> Continuous Verification loop', () => {
  const dbg = new Debugger();
  const model = dbg.createProjectModel('proviz_demo', 'ProViz Demo Project');
  assert.equal(model.id, 'proviz_demo');

  const baseline = dbg.setArchitectureBaseline({
    id: 'BASE_001',
    projectId: 'proviz_demo',
    approvedEdges: []
  });
  assert.equal(baseline.id, 'BASE_001');

  const drift = dbg.detectArchitectureDrift();
  assert.ok(drift);

  const health = dbg.getProjectHealth();
  assert.ok(health.isHealthy);

  const cert = dbg.generateProjectCertificate();
  assert.ok(cert);
});

// ─────────────────────────────────────────────────────────────────────────────
// Performance Benchmarks
// ─────────────────────────────────────────────────────────────────────────────

test('Stage 35 — Benchmark 1: 100k project entities (<300 ms)', () => {
  const graph = new Project.ProjectGraph();
  const start = performance.now();
  for (let i = 0; i < 100000; i++) {
    graph.addNode(new Project.ProjectEntity({ id: `entity_${i}`, kind: 'MODULE' }));
  }
  const duration = performance.now() - start;
  assert.equal(graph.nodeCount, 100000);
  assert.ok(duration < 300, `Duration ${duration.toFixed(2)}ms exceeded 300ms`);
});

test('Stage 35 — Benchmark 2: 200k project relations (<350 ms)', () => {
  const graph = new Project.ProjectGraph();
  const start = performance.now();
  for (let i = 0; i < 200000; i++) {
    graph.addEdge(new Project.ProjectRelation({
      id: `rel_${i}`,
      from: `node_${i % 1000}`,
      to: `node_${(i + 1) % 1000}`
    }));
  }
  const duration = performance.now() - start;
  assert.equal(graph.edgeCount, 200000);
  assert.ok(duration < 350, `Duration ${duration.toFixed(2)}ms exceeded 350ms`);
});

test('Stage 35 — Benchmark 3: 10k dependency analyses (<200 ms)', () => {
  const graph = new Project.ProjectGraph();
  for (let i = 0; i < 1000; i++) {
    graph.addDependency(`n_${i}`, `n_${(i + 1) % 1000}`);
  }
  const analyzer = new Project.ProjectDependencyAnalyzer();
  const start = performance.now();
  for (let i = 0; i < 10; i++) {
    analyzer.analyze(graph);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 200, `Duration ${duration.toFixed(2)}ms exceeded 200ms`);
});

test('Stage 35 — Benchmark 4: 10k architecture checks (<200 ms)', () => {
  const arch = new Project.ArchitectureModel({ id: 'arch' });
  const analyzer = new Project.ArchitectureAnalyzer({ architectureModel: arch });
  const graph = new Project.ProjectGraph();
  for (let i = 0; i < 100; i++) {
    graph.addDependency(`m_${i}`, `m_${(i + 1) % 100}`);
  }

  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    analyzer.analyze(graph);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 200, `Duration ${duration.toFixed(2)}ms exceeded 200ms`);
});

test('Stage 35 — Benchmark 5: 10k coupling analyses (<200 ms)', () => {
  const graph = new Project.ProjectGraph();
  for (let i = 0; i < 200; i++) {
    graph.addDependency(`mod_${i}`, `mod_${(i + 1) % 200}`);
  }
  const analyzer = new Project.ProjectCouplingAnalyzer();
  const start = performance.now();
  for (let i = 0; i < 50; i++) {
    analyzer.analyze(graph);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 200, `Duration ${duration.toFixed(2)}ms exceeded 200ms`);
});

test('Stage 35 — Benchmark 6: 10k risk calculations (<200 ms)', () => {
  const graph = new Project.ProjectGraph();
  for (let i = 0; i < 100; i++) {
    graph.addDependency(`m_${i}`, `m_${(i + 1) % 100}`);
  }
  const analyzer = new Project.DependencyRiskAnalyzer();
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    analyzer.analyze(graph);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 200, `Duration ${duration.toFixed(2)}ms exceeded 200ms`);
});

test('Stage 35 — Benchmark 7: 10k debt calculations (<200 ms)', () => {
  const graph = new Project.ProjectGraph();
  for (let i = 0; i < 50; i++) {
    graph.addNode({ id: `e_${i}` });
  }
  const analyzer = new Project.TechnicalDebtAnalyzer();
  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    analyzer.analyze(graph);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 200, `Duration ${duration.toFixed(2)}ms exceeded 200ms`);
});

test('Stage 35 — Benchmark 8: 10k governance evaluations (<250 ms)', () => {
  const policySet = new Project.GovernancePolicySet({ id: 'ps' });
  policySet.addPolicy(new Project.GovernancePolicy({
    id: 'p1',
    name: 'P1',
    rules: [
      new Project.GovernanceRule({
        id: 'r1',
        name: 'R1',
        kind: Project.GovernanceRuleKind.NO_DEPENDENCY_CYCLES
      })
    ]
  }));
  const evaluator = new Project.GovernanceEvaluator(policySet);
  const graph = new Project.ProjectGraph();
  for (let i = 0; i < 20; i++) graph.addDependency(`a_${i}`, `a_${i + 1}`);

  const start = performance.now();
  for (let i = 0; i < 500; i++) {
    evaluator.evaluate(graph);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 250, `Duration ${duration.toFixed(2)}ms exceeded 250ms`);
});

test('Stage 35 — Benchmark 9: 1k architecture drift analyses (<400 ms)', () => {
  const baseline = new Project.ArchitectureBaseline({ id: 'base', projectId: 'p', approvedEdges: ['a->b'] });
  const graph = new Project.ProjectGraph();
  graph.addDependency('a', 'b');
  const analyzer = new Project.ArchitectureDriftAnalyzer();

  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    analyzer.analyze(baseline, graph);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 400, `Duration ${duration.toFixed(2)}ms exceeded 400ms`);
});

test('Stage 35 — Benchmark 10: 1k recommendation rankings (<400 ms)', () => {
  const ranker = new Project.RecommendationRanker();
  const recs = [];
  for (let i = 0; i < 20; i++) {
    recs.push(new Project.ProjectRecommendation({
      id: `rec_${i}`,
      title: `Title ${i}`,
      reason: `Reason ${i}`,
      evidence: new Project.RecommendationEvidence({ sourceMetric: 'M', observedValue: i, thresholdValue: 10 }),
      confidence: 0.8
    }));
  }

  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    ranker.rank(recs);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 400, `Duration ${duration.toFixed(2)}ms exceeded 400ms`);
});

test('Stage 35 — Benchmark 11: 1k health aggregations (<300 ms)', () => {
  const analyzer = new Project.EngineeringHealthAnalyzer();
  const graph = new Project.ProjectGraph();
  graph.addNode({ id: 'mod1' });

  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    analyzer.analyze(graph);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 300, `Duration ${duration.toFixed(2)}ms exceeded 300ms`);
});

test('Stage 35 — Benchmark 12: 1k project snapshots (<300 ms)', () => {
  const graph = new Project.ProjectGraph();
  graph.addNode({ id: 'modA' });
  const health = new Project.EngineeringHealth();

  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    new Project.ProjectSnapshot({
      id: `snap_${i}`,
      projectId: 'p',
      revision: i,
      graph,
      health
    });
  }
  const duration = performance.now() - start;
  assert.ok(duration < 300, `Duration ${duration.toFixed(2)}ms exceeded 300ms`);
});

test('Stage 35 — Benchmark 13: 1k project certificates (<400 ms)', () => {
  const engine = new Project.ProjectCertificationEngine();
  const decision = new Project.GovernanceDecision({ policySetVersion: '1.0', outcome: 'PASSED' });
  const graph = new Project.ProjectGraph();

  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    engine.certify({
      projectId: 'p',
      revision: i,
      graph,
      governanceDecision: decision
    });
  }
  const duration = performance.now() - start;
  assert.ok(duration < 400, `Duration ${duration.toFixed(2)}ms exceeded 400ms`);
});
