/**
 * ProjectIntelligenceEngine.js
 * Master orchestrator for project-level intelligence, architecture governance, engineering analytics, and certification.
 */

import { ProjectModel } from './ProjectModel.js';
import { ProjectState } from './ProjectState.js';
import { ProjectSnapshot } from './ProjectSnapshot.js';
import { ProjectGraph } from './ProjectGraph.js';
import { ArchitectureModel } from './ArchitectureModel.js';
import { ArchitectureAnalyzer } from './ArchitectureAnalyzer.js';
import { ArchitectureBaseline } from './ArchitectureBaseline.js';
import { ArchitectureDriftAnalyzer } from './ArchitectureDriftAnalyzer.js';
import { ArchitectureEvolutionTracker } from './ArchitectureEvolutionTracker.js';
import { ProjectDependencyAnalyzer } from './ProjectDependencyAnalyzer.js';
import { DependencyCentralityAnalyzer } from './DependencyCentralityAnalyzer.js';
import { DependencyRiskAnalyzer } from './DependencyRiskAnalyzer.js';
import { DependencyHotspotAnalyzer } from './DependencyHotspotAnalyzer.js';
import { DependencyStabilityAnalyzer } from './DependencyStabilityAnalyzer.js';
import { StructuralHealthAnalyzer } from './StructuralHealthAnalyzer.js';
import { EngineeringHealthAnalyzer } from './EngineeringHealthAnalyzer.js';
import { EngineeringHealth } from './EngineeringHealth.js';
import { HealthTrendAnalyzer } from './HealthTrendAnalyzer.js';
import { RiskHotspotAnalyzer } from './RiskHotspotAnalyzer.js';
import { RiskPropagationAnalyzer } from './RiskPropagationAnalyzer.js';
import { RiskForecast } from './RiskForecast.js';
import { TechnicalDebtAnalyzer } from './TechnicalDebtAnalyzer.js';
import { TechnicalDebt } from './TechnicalDebt.js';
import { VerificationDebtMap } from './VerificationDebtMap.js';
import { DebtForecast } from './DebtForecast.js';
import { DebtReductionPlan } from './DebtReductionPlan.js';
import { ProjectChangeHistory } from './ProjectChangeHistory.js';
import { ChangeHotspotAnalyzer } from './ChangeHotspotAnalyzer.js';
import { ChangeCouplingAnalyzer } from './ChangeCouplingAnalyzer.js';
import { ChangeFrequencyAnalyzer } from './ChangeFrequencyAnalyzer.js';
import { ChangeForecast } from './ChangeForecast.js';
import { ChangeRiskForecast } from './ChangeRiskForecast.js';
import { ProjectOwnership } from './ProjectOwnership.js';
import { OwnershipAnalyzer } from './OwnershipAnalyzer.js';
import { GovernancePolicySet } from './GovernancePolicySet.js';
import { GovernancePolicy } from './GovernancePolicy.js';
import { GovernanceRule, GovernanceRuleKind } from './GovernanceRule.js';
import { GovernanceEvaluator } from './GovernanceEvaluator.js';
import { SpecificationCoverageAnalyzer } from './SpecificationCoverageAnalyzer.js';
import { TraceabilityAnalyzer } from './TraceabilityAnalyzer.js';
import { ProjectVerificationGapAnalyzer } from './ProjectVerificationGapAnalyzer.js';
import { VerificationCoverageMap } from './VerificationCoverageMap.js';
import { VerificationPortfolioAnalyzer } from './VerificationPortfolioAnalyzer.js';
import { EngineeringForecast } from './EngineeringForecast.js';
import { FailureForecast } from './FailureForecast.js';
import { RegressionForecast } from './RegressionForecast.js';
import { ArchitectureRiskForecast } from './ArchitectureRiskForecast.js';
import { VerificationCostForecast } from './VerificationCostForecast.js';
import { RecommendationGenerator } from './RecommendationGenerator.js';
import { RecommendationRanker } from './RecommendationRanker.js';
import { ArchitectureRemediationPlanner } from './ArchitectureRemediationPlanner.js';
import { ProjectHealthSnapshot } from './ProjectHealthSnapshot.js';
import { ProjectHealthHistory } from './ProjectHealthHistory.js';
import { ProjectHealthDiff } from './ProjectHealthDiff.js';
import { ProjectCertificationEngine } from './ProjectCertificationEngine.js';

export class ProjectIntelligenceEngine {
  /**
   * @param {Object} [options]
   * @param {string} [options.projectId='default_project']
   * @param {ProjectGraph} [options.graph]
   * @param {ArchitectureModel} [options.architectureModel]
   * @param {GovernancePolicySet} [options.policySet]
   * @param {ProjectOwnership} [options.ownership]
   */
  constructor(options = {}) {
    this.projectId = options.projectId || 'default_project';
    this.graph = options.graph || new ProjectGraph();
    this.projectModel = new ProjectModel({ id: this.projectId, graph: this.graph });
    this.state = new ProjectState({ projectId: this.projectId, graph: this.graph });

    this.architectureModel = options.architectureModel || new ArchitectureModel({ id: 'default_arch' });
    this.baseline = null;
    this.driftTracker = new ArchitectureEvolutionTracker();

    this.changeHistory = new ProjectChangeHistory();
    this.ownership = options.ownership || new ProjectOwnership();
    this.policySet = options.policySet || new GovernancePolicySet({ id: 'default_gov_set' });

    // Analyzers
    this.archAnalyzer = new ArchitectureAnalyzer({ architectureModel: this.architectureModel });
    this.driftAnalyzer = new ArchitectureDriftAnalyzer();
    this.depAnalyzer = new ProjectDependencyAnalyzer();
    this.centralityAnalyzer = new DependencyCentralityAnalyzer();
    this.depRiskAnalyzer = new DependencyRiskAnalyzer();
    this.hotspotAnalyzer = new DependencyHotspotAnalyzer();
    this.stabilityAnalyzer = new DependencyStabilityAnalyzer();
    this.structuralAnalyzer = new StructuralHealthAnalyzer();
    this.healthAnalyzer = new EngineeringHealthAnalyzer();
    this.healthTrendAnalyzer = new HealthTrendAnalyzer();
    this.riskHotspotAnalyzer = new RiskHotspotAnalyzer();
    this.techDebtAnalyzer = new TechnicalDebtAnalyzer();
    this.specCoverageAnalyzer = new SpecificationCoverageAnalyzer();
    this.traceabilityAnalyzer = new TraceabilityAnalyzer();
    this.verifGapAnalyzer = new ProjectVerificationGapAnalyzer();
    this.verifPortfolioAnalyzer = new VerificationPortfolioAnalyzer();
    this.recGenerator = new RecommendationGenerator();
    this.recRanker = new RecommendationRanker();
    this.remediationPlanner = new ArchitectureRemediationPlanner();
    this.certificationEngine = new ProjectCertificationEngine();
    this.healthHistory = new ProjectHealthHistory();

    // Cache
    this._lastHealth = null;
    this._lastGovernanceDecision = null;
  }

  createProjectModel(id = this.projectId, name = '') {
    this.projectModel = new ProjectModel({ id, name, graph: this.graph });
    return this.projectModel;
  }

  getProjectModel() {
    return this.projectModel;
  }

  getProjectSnapshot() {
    const health = this.getProjectHealth();
    const arch = this.analyzeArchitecture();
    const debt = this.getTechnicalDebt();
    const risks = this.getRiskHotspots();
    const gov = this.getGovernanceDecision();

    return new ProjectSnapshot({
      id: `SNAPSHOT_${this.projectId}_REV${this.state.revision}_${Date.now()}`,
      projectId: this.projectId,
      revision: this.state.revision,
      graph: this.graph,
      health: health.toJSON(),
      architecture: arch,
      debt: debt.toJSON(),
      risks,
      governance: gov ? gov.toJSON() : {},
      timestamp: Date.now()
    });
  }

  // Architecture Intelligence
  analyzeArchitecture(model = this.architectureModel) {
    return this.archAnalyzer.analyze(this.graph, model);
  }

  setArchitectureBaseline(baselineData) {
    this.baseline = baselineData instanceof ArchitectureBaseline ? baselineData : new ArchitectureBaseline(baselineData);
    return this.baseline;
  }

  getArchitectureBaseline() {
    return this.baseline;
  }

  detectArchitectureDrift(provenance = {}) {
    if (!this.baseline) {
      // Auto-create baseline if none exists
      const edges = this.graph.getEdges().map(e => `${e.from}->${e.to}`);
      this.baseline = new ArchitectureBaseline({
        id: `BASELINE_${this.projectId}`,
        projectId: this.projectId,
        revision: this.state.revision,
        approvedEdges: edges
      });
    }
    const archRes = this.analyzeArchitecture();
    const drift = this.driftAnalyzer.analyze(this.baseline, this.graph, archRes.violations, provenance);
    this.driftTracker.recordDrift(drift);
    return drift;
  }

  getArchitectureViolations() {
    return this.analyzeArchitecture().violations;
  }

  // Dependency & Structural Intelligence
  analyzeProjectDependencies() {
    return this.depAnalyzer.analyze(this.graph);
  }

  getDependencyCentrality() {
    return this.centralityAnalyzer.analyze(this.graph);
  }

  getDependencyRisk(options = {}) {
    return this.depRiskAnalyzer.analyze(this.graph, options);
  }

  getDependencyHotspots() {
    return this.hotspotAnalyzer.analyze(this.graph);
  }

  analyzeStructuralHealth() {
    return this.structuralAnalyzer.analyze(this.graph, this.architectureModel);
  }

  // Risk Concentration
  analyzeRiskConcentration(inputs = {}) {
    return this.riskHotspotAnalyzer.analyze(this.graph, inputs);
  }

  getRiskHotspots(inputs = {}) {
    return this.analyzeRiskConcentration(inputs);
  }

  propagateRisk(sourceId, initialRisk = 1.0) {
    const propAnalyzer = new RiskPropagationAnalyzer(this.graph);
    return propAnalyzer.propagateRisk(sourceId, initialRisk);
  }

  forecastProjectRisk(targetScope = 'entire_project') {
    const hotspots = this.getRiskHotspots();
    const topRisk = hotspots.topHotspots && hotspots.topHotspots.length > 0 ? hotspots.topHotspots[0].hotspotRisk : 0.05;
    return new RiskForecast({
      targetScope,
      predictedFailureProbability: Math.min(1.0, topRisk * 2),
      predictedBlastRadius: hotspots.criticalCount + hotspots.highCount,
      riskFactors: hotspots.topHotspots ? hotspots.topHotspots.flatMap(h => h.contributingFactors) : []
    });
  }

  // Debt Intelligence
  analyzeTechnicalDebt(inputs = {}) {
    const archAnalysis = inputs.architectureAnalysis || this.analyzeArchitecture();
    const structuralHealth = inputs.structuralHealth || this.analyzeStructuralHealth();
    const verificationGaps = inputs.verificationGaps || this.getVerificationGaps();

    return this.techDebtAnalyzer.analyze(this.graph, {
      architectureAnalysis: archAnalysis,
      structuralHealth,
      verificationGaps
    });
  }

  getTechnicalDebt(inputs = {}) {
    return this.analyzeTechnicalDebt(inputs);
  }

  getVerificationDebtMap() {
    const gaps = this.getVerificationGaps();
    const map = {};
    for (const g of gaps.gaps) {
      if (!map[g.entityId]) map[g.entityId] = [];
      map[g.entityId].push(g);
    }
    return new VerificationDebtMap({
      entityDebtMap: map,
      debtScore: gaps.gapCount * 2.5
    });
  }

  forecastDebt(growthRate = 1.15, months = 6) {
    const debt = this.getTechnicalDebt();
    const projected = debt.totalDebtScore * Math.pow(growthRate, months / 3);
    return new DebtForecast({
      currentDebtScore: debt.totalDebtScore,
      projectedDebtScore: projected,
      growthRate,
      timeHorizonMonths: months
    });
  }

  generateDebtReductionPlan(maxActions = 10) {
    const debt = this.getTechnicalDebt();
    return DebtReductionPlan.fromTechnicalDebt(debt, maxActions);
  }

  // Change Intelligence
  recordChange(changeData) {
    return this.changeHistory.recordChange(changeData);
  }

  getChangeHistory() {
    return this.changeHistory;
  }

  getChangeHotspots() {
    const analyzer = new ChangeHotspotAnalyzer();
    return analyzer.analyze(this.changeHistory);
  }

  getChangeCoupling() {
    const analyzer = new ChangeCouplingAnalyzer();
    return analyzer.analyze(this.changeHistory);
  }

  forecastChangeRisk(changedEntityIds = []) {
    const hotspots = this.getRiskHotspots();
    const changedSet = new Set(changedEntityIds);
    const affectedHotspots = (hotspots.hotspots || []).filter(h => changedSet.has(h.entityId));
    const score = affectedHotspots.reduce((acc, h) => acc + h.hotspotRisk, 0);

    return new ChangeRiskForecast({
      changedEntityIds,
      predictedRiskScore: Math.min(1.0, score + 0.1),
      estimatedBlastRadius: changedEntityIds.length * 3,
      riskFactors: affectedHotspots.map(h => `High risk in ${h.entityId}`)
    });
  }

  // Ownership & Responsibility
  getProjectOwnership() {
    return this.ownership;
  }

  getResponsibilityMap() {
    return this.ownership.responsibilityMap;
  }

  analyzeOwnership() {
    const analyzer = new OwnershipAnalyzer();
    return analyzer.analyze(this.graph, this.ownership);
  }

  // Governance Engine
  evaluateGovernance(evidenceData = {}) {
    const archRes = evidenceData.architectureAnalysis || this.analyzeArchitecture();
    const evaluator = new GovernanceEvaluator(this.policySet);
    const decision = evaluator.evaluate(this.graph, {
      ...evidenceData,
      architectureAnalysis: archRes
    });
    this._lastGovernanceDecision = decision;
    return decision;
  }

  getGovernanceViolations() {
    const decision = this.getGovernanceDecision();
    return decision ? decision.violations : [];
  }

  getGovernanceDecision() {
    if (!this._lastGovernanceDecision) {
      this._lastGovernanceDecision = this.evaluateGovernance();
    }
    return this._lastGovernanceDecision;
  }

  // Specification & Traceability
  getRequirementCoverage() {
    return this.specCoverageAnalyzer.analyze(this.graph);
  }

  getTraceabilityMatrix() {
    return this.traceabilityAnalyzer.analyze(this.graph);
  }

  getVerificationCoverageMap() {
    const map = new VerificationCoverageMap(this.graph);
    return map.generateMap();
  }

  getVerificationGaps() {
    return this.verifGapAnalyzer.analyze(this.graph);
  }

  getVerificationPortfolio() {
    return this.verifPortfolioAnalyzer.analyze(this.graph);
  }

  // Health Model
  getProjectHealth(inputs = {}) {
    const archAnalysis = inputs.architectureAnalysis || this.analyzeArchitecture();
    const techDebt = inputs.technicalDebt || this.getTechnicalDebt();
    const verifGaps = inputs.verificationGaps || this.getVerificationGaps();
    const verifDebt = this.getVerificationDebtMap();

    const health = this.healthAnalyzer.analyze(this.graph, {
      ...inputs,
      architectureAnalysis: archAnalysis,
      technicalDebt: techDebt,
      verificationDebt: verifDebt
    });

    this._lastHealth = health;
    return health;
  }

  getProjectHealthHistory() {
    return this.healthHistory;
  }

  compareProjectHealth(previousHealth, currentHealth) {
    return this.healthTrendAnalyzer.compare(previousHealth, currentHealth);
  }

  createProjectHealthSnapshot() {
    const health = this.getProjectHealth();
    const snap = new ProjectHealthSnapshot({
      id: `HEALTH_SNAP_${this.projectId}_REV${this.state.revision}_${Date.now()}`,
      projectId: this.projectId,
      revision: this.state.revision,
      health
    });
    this.healthHistory.addSnapshot(snap);
    return snap;
  }

  compareProjectSnapshots(snapA, snapB) {
    return ProjectHealthDiff.diff(snapA, snapB);
  }

  // Predictive Engineering Analytics
  forecastEngineeringRisk() {
    const failureForecast = this.forecastProjectRisk();
    const debt = this.getTechnicalDebt();

    return new EngineeringForecast({
      predictedOverallFailureRisk: failureForecast.predictedFailureProbability,
      predictedRegressionProbability: 0.12,
      estimatedVerificationCostHours: Number((debt.totalDebtScore * 0.5).toFixed(2)),
      forecastBreakdown: {
        architectureRisk: 0.15,
        debtImpact: debt.totalDebtScore
      }
    });
  }

  forecastRegressionRisk(targetEntityId) {
    const freq = new ChangeFrequencyAnalyzer().analyze(this.changeHistory);
    const record = freq.frequencies.find(f => f.entityId === targetEntityId);
    const prob = record ? record.regressionRate : 0.08;

    return new RegressionForecast({
      targetEntityId,
      regressionProbability: prob,
      historicalIndicators: record ? [`${record.regressionCount} historical regressions`] : []
    });
  }

  forecastVerificationCost(entityIds = []) {
    const count = entityIds.length || this.graph.nodeCount;
    return new VerificationCostForecast({
      estimatedVerificationTimeMs: count * 15,
      estimatedObligationsToVerify: count * 2,
      estimatedCpuHours: (count * 0.005)
    });
  }

  // Recommendations
  generateProjectRecommendations() {
    const archAnalysis = this.analyzeArchitecture();
    const drift = this.detectArchitectureDrift();
    const gaps = this.getVerificationGaps();
    const debt = this.getTechnicalDebt();
    const hotspots = this.getRiskHotspots();

    return this.recGenerator.generate({
      architectureAnalysis: archAnalysis,
      architectureDrift: drift,
      verificationGaps: gaps,
      technicalDebt: debt,
      riskHotspots: hotspots
    });
  }

  rankProjectRecommendations(recommendations = this.generateProjectRecommendations(), weights = {}) {
    return this.recRanker.rank(recommendations, weights);
  }

  // Remediation
  planArchitectureRemediation(violations = this.getArchitectureViolations()) {
    return this.remediationPlanner.planRemediation(violations, this.graph);
  }

  validateArchitectureRemediation(plan, context = {}) {
    return this.remediationPlanner.validateRemediation(plan, context);
  }

  // Certification
  generateProjectCertificate(options = {}) {
    const govDecision = options.governanceDecision || this.getGovernanceDecision();
    const health = options.health || this.getProjectHealth();
    const verifPort = options.verificationPortfolio || this.getVerificationPortfolio();
    const gaps = options.knownGaps || this.getVerificationGaps().gaps;
    const risks = options.knownRisks || this.getRiskHotspots().hotspots;

    return this.certificationEngine.certify({
      projectId: this.projectId,
      revision: this.state.revision,
      graph: this.graph,
      governanceDecision: govDecision,
      health,
      verificationPortfolio: verifPort,
      knownGaps: gaps,
      knownRisks: risks,
      assumptions: options.assumptions
    });
  }
}
