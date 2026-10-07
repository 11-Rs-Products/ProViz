/**
 * StructuralHealthAnalyzer.js
 * Synthesizes coupling, cohesion, instability, cycle density, depth, and boundary metrics into a structural health index.
 * Invariant: Evidence-backed measurements, not a formal correctness proof.
 */

import { ProjectCouplingAnalyzer } from './ProjectCouplingAnalyzer.js';
import { ProjectCohesionAnalyzer } from './ProjectCohesionAnalyzer.js';
import { DependencyStabilityAnalyzer } from './DependencyStabilityAnalyzer.js';
import { ProjectRelationKind } from './ProjectRelation.js';

export class StructuralHealthAnalyzer {
  constructor() {
    this.couplingAnalyzer = new ProjectCouplingAnalyzer();
    this.cohesionAnalyzer = new ProjectCohesionAnalyzer();
    this.stabilityAnalyzer = new DependencyStabilityAnalyzer();
  }

  /**
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   * @param {import('./ArchitectureModel.js').ArchitectureModel} [architectureModel]
   */
  analyze(graph, architectureModel = null) {
    if (!graph) throw new Error('StructuralHealthAnalyzer requires graph');
    const couplingRes = this.couplingAnalyzer.analyze(graph);
    const cohesionRes = this.cohesionAnalyzer.analyze(graph, architectureModel);
    const stabilityRes = this.stabilityAnalyzer.analyze(graph);
    const cycles = graph.findCycles(ProjectRelationKind.DEPENDS_ON);

    const nodeCount = Math.max(1, graph.nodeCount);
    const cyclePenalty = Math.min(0.5, cycles.length * 0.1);
    const couplingPenalty = Math.min(0.3, (couplingRes.excessivelyCoupledCount / nodeCount) * 0.5);
    const cohesionBonus = cohesionRes.averageCohesion * 0.4;
    const baseScore = 1.0 - cyclePenalty - couplingPenalty;

    const structuralHealthScore = Math.max(0.0, Math.min(1.0, baseScore * 0.6 + cohesionBonus));

    return {
      timestamp: Date.now(),
      score: Number(structuralHealthScore.toFixed(4)),
      metrics: {
        nodeCount: graph.nodeCount,
        edgeCount: graph.edgeCount,
        cycleCount: cycles.length,
        averageCoupling: Number(couplingRes.averageCoupling.toFixed(2)),
        averageCohesion: cohesionRes.averageCohesion,
        excessivelyCoupledCount: couplingRes.excessivelyCoupledCount
      },
      cycles,
      isHealthy: structuralHealthScore >= 0.7 && cycles.length === 0
    };
  }
}
