/**
 * SemanticEngine.js
 * Central Facade Engine for Stage 29: Universal Semantic Program Model,
 * Dependency Intelligence & Whole-System Impact Reasoning.
 */

import { SemanticEntityKind } from './SemanticEntityKind.js';
import { SemanticRelationKind } from './SemanticRelationKind.js';
import { SemanticNode } from './SemanticNode.js';
import { SemanticEdge } from './SemanticEdge.js';
import { SemanticProgramGraph } from './SemanticProgramGraph.js';
import { SemanticGraphBuilder } from './SemanticGraphBuilder.js';
import { DependencyKind } from './DependencyKind.js';
import { DependencyEdge } from './DependencyEdge.js';
import { DependencyClosure } from './DependencyClosure.js';
import { SemanticChange, SemanticChangeType } from './SemanticChange.js';
import { ImpactAnalyzer } from './ImpactAnalyzer.js';
import { BlastRadius, BlastRadiusScope, BlastRadiusSeverity } from './BlastRadius.js';
import { ConditionalDependency } from './ConditionalDependency.js';
import { ConditionalImpactAnalyzer } from './ConditionalImpactAnalyzer.js';
import { BehaviorImpact, BehaviorImpactDimension } from './BehaviorImpact.js';
import { BehaviorImpactAnalyzer } from './BehaviorImpactAnalyzer.js';
import { SpecificationImpactAnalyzer } from './SpecificationImpactAnalyzer.js';
import { VerificationImpactAnalyzer } from './VerificationImpactAnalyzer.js';
import { TestImpactAnalyzer } from './TestImpactAnalyzer.js';
import { RegressionSelector } from './RegressionSelector.js';
import { APIContract } from './APIContract.js';
import { APICompatibilityAnalyzer, CompatibilityStatus } from './APICompatibilityAnalyzer.js';
import { SemanticVersionImpact, SemVerLevel } from './SemanticVersionImpact.js';
import { ArchitectureGraph, ArchitectureNode, ArchitectureLayer } from './ArchitectureGraph.js';
import { ArchitectureAnalyzer } from './ArchitectureAnalyzer.js';
import { CouplingMetrics } from './CouplingMetrics.js';
import { CohesionAnalyzer } from './CohesionAnalyzer.js';
import { DependencyCycle, CycleClassification } from './DependencyCycle.js';
import { CycleAnalyzer } from './CycleAnalyzer.js';
import { SemanticRefactoring, RefactoringType } from './SemanticRefactoring.js';
import { RefactoringValidator } from './RefactoringValidator.js';
import { SemanticEquivalence, EquivalenceKind } from './SemanticEquivalence.js';
import { EquivalenceAnalyzer } from './EquivalenceAnalyzer.js';
import { SemanticDiff } from './SemanticDiff.js';
import { SemanticMonitor } from './SemanticMonitor.js';
import { SemanticKnowledgeSynchronizer } from './SemanticKnowledgeSynchronizer.js';
import { ChangeRiskModel } from './ChangeRiskModel.js';
import { ChangeRiskAnalyzer } from './ChangeRiskAnalyzer.js';
import { SemanticOwnership } from './SemanticOwnership.js';
import { SemanticImpactPlanner } from './SemanticImpactPlanner.js';
import { SemanticSnapshot } from './SemanticSnapshot.js';

export class SemanticEngine {
  constructor(options = {}) {
    this.graph = new SemanticProgramGraph();
    this.builder = new SemanticGraphBuilder();
    this.impactAnalyzer = new ImpactAnalyzer(options.impactWeights);
    this.conditionalAnalyzer = new ConditionalImpactAnalyzer();
    this.behaviorAnalyzer = new BehaviorImpactAnalyzer();
    this.specAnalyzer = new SpecificationImpactAnalyzer();
    this.verificationAnalyzer = new VerificationImpactAnalyzer();
    this.testImpactAnalyzer = new TestImpactAnalyzer();
    this.regressionSelector = new RegressionSelector(this.testImpactAnalyzer);
    this.apiCompatibilityAnalyzer = new APICompatibilityAnalyzer();
    this.architectureAnalyzer = new ArchitectureAnalyzer();
    this.cohesionAnalyzer = new CohesionAnalyzer();
    this.cycleAnalyzer = new CycleAnalyzer();
    this.refactoringValidator = new RefactoringValidator();
    this.equivalenceAnalyzer = new EquivalenceAnalyzer();
    this.monitor = new SemanticMonitor();
    this.synchronizer = new SemanticKnowledgeSynchronizer();
    this.riskAnalyzer = new ChangeRiskAnalyzer();
    this.ownership = new SemanticOwnership();
    this.impactPlanner = new SemanticImpactPlanner();

    this._snapshots = new Map(); // name -> SemanticSnapshot
  }

  // Graph Mutation & Querying
  addNode(node) {
    this.graph.addNode(node);
    return this;
  }

  getNode(id) {
    return this.graph.getNode(id);
  }

  hasNode(id) {
    return this.graph.hasNode(id);
  }

  addEdge(edge) {
    this.graph.addEdge(edge);
    return this;
  }

  getEdge(id) {
    return this.graph.getEdge(id);
  }

  getNeighbors(nodeId, direction = 'BOTH') {
    return this.graph.getNeighbors(nodeId, direction);
  }

  buildFromSource(file, code, options = {}) {
    const builtGraph = this.builder.buildFromSource(file, code, options);
    for (const node of builtGraph.queryNodes()) this.graph.addNode(node);
    for (const edge of builtGraph.queryEdges()) this.graph.addEdge(edge);
    return this.graph;
  }

  // Dependency Closures
  getDependencies(nodeId, kindFilter = null) {
    const closure = DependencyClosure.buildFromProgramGraph(this.graph);
    return closure.getDependencies(nodeId, kindFilter);
  }

  getDependents(nodeId, kindFilter = null) {
    const closure = DependencyClosure.buildFromProgramGraph(this.graph);
    return closure.getDependents(nodeId, kindFilter);
  }

  getTransitiveClosure(nodeId, maxDepth = 50, kindFilter = null) {
    const closure = DependencyClosure.buildFromProgramGraph(this.graph);
    return closure.getTransitiveClosure(nodeId, maxDepth, kindFilter);
  }

  getReverseClosure(nodeId, maxDepth = 50, kindFilter = null) {
    const closure = DependencyClosure.buildFromProgramGraph(this.graph);
    return closure.getReverseClosure(nodeId, maxDepth, kindFilter);
  }

  // Change Impact Analysis
  analyzeSemanticChange(change, options = {}) {
    if (!(change instanceof SemanticChange)) {
      change = new SemanticChange(change);
    }
    const impactResult = this.impactAnalyzer.analyze(change, this.graph, options);
    const riskModel = this.riskAnalyzer.analyzeRisk(impactResult, this.graph, options);
    const specImpact = this.specAnalyzer.analyze(change, this.graph);
    const verifImpact = this.verificationAnalyzer.analyze(change, this.graph);
    const behaviorImpact = this.behaviorAnalyzer.analyze(change, this.graph, options.historicalExecutions);
    const plan = this.impactPlanner.planFromImpact(impactResult, riskModel, options);

    return {
      change,
      impactScore: impactResult.impactScore,
      breakdown: impactResult.breakdown,
      blastRadius: impactResult.blastRadius,
      riskModel,
      specImpact,
      verifImpact,
      behaviorImpact,
      plan
    };
  }

  getBlastRadius(change) {
    if (!(change instanceof SemanticChange)) {
      change = new SemanticChange(change);
    }
    const res = this.impactAnalyzer.analyze(change, this.graph);
    return res.blastRadius;
  }

  // Conditional Impact
  getConditionalImpact(nodeId, context = {}) {
    return this.conditionalAnalyzer.filterReachableDependents(nodeId, context);
  }

  // Testing & Regression
  rankAffectedTests(change, testMetadata = {}) {
    if (!(change instanceof SemanticChange)) {
      change = new SemanticChange(change);
    }
    return this.testImpactAnalyzer.rankTests(change, this.graph, testMetadata);
  }

  selectRegressionTests(change, options = {}) {
    if (!(change instanceof SemanticChange)) {
      change = new SemanticChange(change);
    }
    return this.regressionSelector.selectTests(change, this.graph, options);
  }

  // API Compatibility & Versioning
  checkAPICompatibility(oldContract, newContract) {
    return this.apiCompatibilityAnalyzer.compare(oldContract, newContract);
  }

  evaluateSemanticVersionImpact(compatibilityResult, changes = []) {
    return SemanticVersionImpact.evaluate(compatibilityResult, changes);
  }

  // Architecture & Coupling
  getArchitectureGraph() {
    return new ArchitectureGraph();
  }

  analyzeArchitecture(archGraph) {
    return this.architectureAnalyzer.analyze(archGraph);
  }

  calculateCouplingMetrics(nodeId) {
    return CouplingMetrics.calculate(nodeId, this.graph);
  }

  analyzeCohesion(scopeId) {
    return this.cohesionAnalyzer.analyze(scopeId, this.graph);
  }

  detectCycles() {
    return this.cycleAnalyzer.detectCycles(this.graph);
  }

  // Refactoring & Equivalence
  validateSemanticRefactoring(refactoring, beforeGraph = null, afterGraph = null, options = {}) {
    const bGraph = beforeGraph || this.graph;
    const aGraph = afterGraph || this.graph;
    return this.refactoringValidator.validate(refactoring, bGraph, aGraph, options);
  }

  checkSemanticEquivalence(nodeA, nodeB, options = {}) {
    return this.equivalenceAnalyzer.checkEquivalence(nodeA, nodeB, options);
  }

  diffSemanticGraphs(graphA, graphB) {
    return SemanticDiff.compareGraphs(graphA, graphB);
  }

  // Snapshots & Checkpoints
  checkpoint(name = 'default') {
    const snapshot = new SemanticSnapshot({
      id: `snap:${name}_${Date.now()}`,
      name,
      graphData: this.graph.toJSON()
    });
    this._snapshots.set(name, snapshot);
    return snapshot;
  }

  restore(name = 'default') {
    const snapshot = this._snapshots.get(name);
    if (!snapshot) throw new Error(`Semantic snapshot '${name}' not found`);
    this.graph = snapshot.restoreGraph();
    return this.graph;
  }

  diffSnapshots(nameA, nameB) {
    const snapA = this._snapshots.get(nameA);
    const snapB = this._snapshots.get(nameB);
    if (!snapA || !snapB) throw new Error(`Snapshot ${nameA} or ${nameB} not found`);
    return SemanticDiff.compareGraphs(snapA.restoreGraph(), snapB.restoreGraph());
  }

  replay(changes = []) {
    const results = [];
    for (const change of changes) {
      results.push(this.analyzeSemanticChange(change));
    }
    return results;
  }
}
