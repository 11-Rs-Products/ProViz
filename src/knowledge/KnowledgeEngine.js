import { VerificationKnowledgeGraph } from './VerificationKnowledgeGraph.js';
import { ProvenanceResolver } from './ProvenanceResolver.js';
import { CausalGraph } from './CausalGraph.js';
import { RootCauseAnalyzer } from './RootCauseAnalyzer.js';
import { CounterfactualEngine } from './CounterfactualEngine.js';
import { EvidenceDependencyGraph } from './EvidenceDependencyGraph.js';
import { ImpactPropagation, StalenessPropagator } from './ImpactPropagation.js';
import { SemanticDependencyAnalyzer } from './SemanticDependency.js';
import { TraceabilityAnalyzer } from './TraceabilityAnalyzer.js';
import { KnowledgeExplanationEngine } from './VerificationExplanation.js';
import { KnowledgeQueryEngine } from './KnowledgeQuery.js';
import { KnowledgeGapAnalyzer } from './KnowledgeGapAnalyzer.js';
import { KnowledgeTaskPlanner } from './KnowledgeTaskPlanner.js';
import { KnowledgeMaintenanceEngine } from './KnowledgeMaintenanceEngine.js';
import { KnowledgeSnapshot, KnowledgeDiff } from './KnowledgeSnapshot.js';

/**
 * Universal Verification Knowledge Engine integrating graph representation,
 * causal reasoning, cross-stage provenance, and counterfactual simulation.
 */
export class KnowledgeEngine {
  constructor({
    knowledgeGraph = new VerificationKnowledgeGraph(),
    causalGraph = new CausalGraph(),
    evidenceDependencyGraph = new EvidenceDependencyGraph()
  } = {}) {
    this.graph = knowledgeGraph;
    this.causalGraph = causalGraph;
    this.evidenceDependencyGraph = evidenceDependencyGraph;

    this.provenanceResolver = new ProvenanceResolver(this.graph);
    this.rootCauseAnalyzer = new RootCauseAnalyzer(this.causalGraph, this.graph);
    this.counterfactualEngine = new CounterfactualEngine(this.graph);
    this.stalenessPropagator = new StalenessPropagator(this.evidenceDependencyGraph);
    this.semanticDependencyAnalyzer = new SemanticDependencyAnalyzer(this.graph);
    this.traceabilityAnalyzer = new TraceabilityAnalyzer(this.graph);
    this.explanationEngine = new KnowledgeExplanationEngine(this.graph);
    this.queryEngine = new KnowledgeQueryEngine(this.graph);
    this.gapAnalyzer = new KnowledgeGapAnalyzer(this.graph);
    this.taskPlanner = new KnowledgeTaskPlanner(this.gapAnalyzer);
    this.maintenanceEngine = new KnowledgeMaintenanceEngine(this.graph);

    this._checkpoints = new Map();
    this._trace = [];
  }

  addEntity(entity) {
    const e = this.graph.addEntity(entity);
    this.recordTrace('ENTITY_ADDED', e.toJSON ? e.toJSON() : e);
    return e;
  }

  addEdge(edge) {
    const e = this.graph.addEdge(edge);
    this.recordTrace('EDGE_ADDED', e.toJSON ? e.toJSON() : e);
    return e;
  }

  getEntity(id) {
    return this.graph.getEntity(id);
  }

  getEntities() {
    return this.graph.getEntities();
  }

  getNeighbors(id, options) {
    return this.graph.getNeighbors(id, options);
  }

  findPath(fromId, toId, options) {
    return this.graph.findPath(fromId, toId, options);
  }

  resolveProvenance(entityId) {
    return this.provenanceResolver.resolveChain(entityId);
  }

  addCausalLink(link) {
    const l = this.causalGraph.addLink(link);
    this.recordTrace('CAUSAL_LINK_ADDED', l.toJSON ? l.toJSON() : l);
    return l;
  }

  getCausalChain(effectId) {
    return this.causalGraph.getCausalChain(effectId);
  }

  analyzeRootCause(effectId) {
    return this.rootCauseAnalyzer.analyze(effectId);
  }

  simulateCounterfactual(options) {
    const cf = this.counterfactualEngine.simulateCounterfactual(options);
    this.recordTrace('COUNTERFACTUAL_SIMULATED', cf.toJSON());
    return cf;
  }

  propagateChange(change) {
    const impact = ImpactPropagation.propagateImpact(change, this.graph);
    this.recordTrace('CHANGE_PROPAGATED', { change, impactCount: impact.impactedEntities.size });
    return impact;
  }

  explain(entityId, style = 'SUMMARY') {
    return this.explanationEngine.explain(entityId, style);
  }

  query(queryOptions) {
    return this.queryEngine.executeQuery(queryOptions);
  }

  findGaps() {
    return this.gapAnalyzer.detectGaps();
  }

  planTasksFromGaps() {
    return this.taskPlanner.generatePlanningGoals();
  }

  checkpoint(checkpointId) {
    const id = checkpointId || `know-cp-${Date.now()}`;
    const snap = new KnowledgeSnapshot({
      snapshotId: id,
      entities: this.graph.getEntities(),
      edges: this.graph.getEdges()
    });
    this._checkpoints.set(id, snap);
    return id;
  }

  restoreCheckpoint(checkpointId) {
    const snap = this._checkpoints.get(checkpointId);
    if (!snap) return false;
    this.graph.clear();
    for (const e of snap.entities) this.graph.addEntity(e);
    for (const edge of snap.edges) this.graph.addEdge(edge);
    this.recordTrace('CHECKPOINT_RESTORED', { checkpointId });
    return true;
  }

  getSnapshot() {
    return new KnowledgeSnapshot({
      entities: this.graph.getEntities(),
      edges: this.graph.getEdges()
    });
  }

  recordTrace(event, data) {
    this._trace.push({
      event,
      data,
      timestamp: Date.now()
    });
  }

  getTrace() {
    return [...this._trace];
  }

  replayTrace(trace = null) {
    const target = trace || this._trace;
    const replayed = [];
    for (const step of target) {
      replayed.push({
        event: step.event,
        data: step.data,
        replayedAt: Date.now()
      });
    }
    return replayed;
  }
}
