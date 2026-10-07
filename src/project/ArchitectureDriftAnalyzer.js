/**
 * ArchitectureDriftAnalyzer.js
 * Compares current ProjectGraph and violations against an ArchitectureBaseline to calculate architectural drift.
 */

import { ArchitectureDrift, DriftSeverity } from './ArchitectureDrift.js';
import { ProjectRelationKind } from './ProjectRelation.js';

export class ArchitectureDriftAnalyzer {
  /**
   * Compare baseline with current graph and violations
   * @param {import('./ArchitectureBaseline.js').ArchitectureBaseline} baseline
   * @param {import('./ProjectGraph.js').ProjectGraph} currentGraph
   * @param {Object[]} [currentViolations=[]]
   * @param {Object} [provenance={}]
   */
  analyze(baseline, currentGraph, currentViolations = [], provenance = {}) {
    if (!baseline || !currentGraph) {
      throw new Error('ArchitectureDriftAnalyzer requires baseline and currentGraph');
    }

    const baselineEdges = new Set(baseline.approvedEdges);
    const currentEdges = new Set(
      currentGraph.getEdges()
        .filter(e => e.kind === ProjectRelationKind.DEPENDS_ON || e.kind === ProjectRelationKind.CALLS)
        .map(e => `${e.from}->${e.to}`)
    );

    const addedDependencies = [];
    for (const edge of currentEdges) {
      if (!baselineEdges.has(edge)) {
        addedDependencies.push(edge);
      }
    }

    const removedDependencies = [];
    for (const edge of baselineEdges) {
      if (!currentEdges.has(edge)) {
        removedDependencies.push(edge);
      }
    }

    const newViolations = currentViolations.map(v => v.id || v.message || JSON.stringify(v));

    let severity = DriftSeverity.NONE;
    if (newViolations.some(v => typeof v === 'string' && v.includes('CRITICAL'))) {
      severity = DriftSeverity.CRITICAL;
    } else if (newViolations.length > 0) {
      severity = DriftSeverity.MAJOR;
    } else if (addedDependencies.length > 5) {
      severity = DriftSeverity.MODERATE;
    } else if (addedDependencies.length > 0 || removedDependencies.length > 0) {
      severity = DriftSeverity.MINOR;
    }

    return new ArchitectureDrift({
      baselineId: baseline.id,
      severity,
      addedDependencies,
      removedDependencies,
      newViolations,
      structuralDiff: {
        addedCount: addedDependencies.length,
        removedCount: removedDependencies.length,
        violationCount: newViolations.length
      },
      provenance,
      timestamp: Date.now()
    });
  }
}
