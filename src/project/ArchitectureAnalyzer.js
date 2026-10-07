/**
 * ArchitectureAnalyzer.js
 * Analyzes project graphs against architecture models to detect layer violations, boundary leaks, forbidden edges, and cyclic structures.
 */

import { ArchitectureConstraintKind } from './ArchitectureConstraint.js';
import { ArchitectureDependency } from './ArchitectureDependency.js';
import { ProjectRelationKind } from './ProjectRelation.js';

export class ArchitectureAnalyzer {
  /**
   * @param {Object} [options]
   * @param {ArchitectureModel} [options.architectureModel]
   */
  constructor(options = {}) {
    this.architectureModel = options.architectureModel || null;
  }

  /**
   * Analyze project graph against architecture model
   * @param {import('./ProjectGraph.js').ProjectGraph} graph
   * @param {ArchitectureModel} [model]
   */
  analyze(graph, model = this.architectureModel) {
    if (!graph) throw new Error('ArchitectureAnalyzer requires graph');
    const violations = [];
    const layerDependencies = new Map();

    const currentModel = model || this.architectureModel;

    // 1. Analyze Layer and Boundary dependencies
    const edges = graph.getEdges().filter(e => e.kind === ProjectRelationKind.DEPENDS_ON || e.kind === ProjectRelationKind.CALLS);

    for (const edge of edges) {
      if (currentModel) {
        const fromLayer = currentModel.getLayerForModule(edge.from);
        const toLayer = currentModel.getLayerForModule(edge.to);

        if (fromLayer && toLayer) {
          const key = `${fromLayer.id}->${toLayer.id}`;
          if (!layerDependencies.has(key)) {
            const isAllowed = fromLayer.canDependOn(toLayer.id);
            layerDependencies.set(key, {
              sourceLayer: fromLayer.id,
              targetLayer: toLayer.id,
              count: 0,
              participatingEdges: [],
              isAllowed
            });
          }
          const dep = layerDependencies.get(key);
          dep.count++;
          dep.participatingEdges.push(edge.id);

          if (!dep.isAllowed) {
            violations.push({
              id: `VIOLATION_LAYER_${edge.from}_${edge.to}`,
              kind: 'LAYER_VIOLATION',
              severity: 'ERROR',
              source: edge.from,
              target: edge.to,
              sourceLayer: fromLayer.id,
              targetLayer: toLayer.id,
              edgeId: edge.id,
              message: `Forbidden architectural layer dependency: ${fromLayer.name} (${edge.from}) cannot depend on ${toLayer.name} (${edge.to})`
            });
          }
        }

        // Boundary violations
        const fromBoundary = currentModel.getBoundaryForModule(edge.from);
        const toBoundary = currentModel.getBoundaryForModule(edge.to);

        if (toBoundary && fromBoundary !== toBoundary) {
          // Cross boundary call to an internal module (not in publicAPIs)
          if (!toBoundary.isPublicAPI(edge.to)) {
            violations.push({
              id: `VIOLATION_BOUNDARY_${edge.from}_${edge.to}`,
              kind: 'BOUNDARY_VIOLATION',
              severity: toBoundary.isSecurityBoundary ? 'CRITICAL' : 'ERROR',
              source: edge.from,
              target: edge.to,
              boundary: toBoundary.id,
              isSecurityBoundary: toBoundary.isSecurityBoundary,
              edgeId: edge.id,
              message: `Encapsulation violation: Module ${edge.from} illegally accesses internal module ${edge.to} of boundary ${toBoundary.name}`
            });
          }
        }

        // Rule constraints check
        for (const rule of currentModel.getRules()) {
          if (!rule.enabled) continue;
          for (const constraint of rule.constraints) {
            if (constraint.kind === ArchitectureConstraintKind.FORBID_DEPENDENCY) {
              const { fromPattern, toPattern, fromModule, toModule } = constraint.params;
              const matchesFrom = fromModule ? edge.from === fromModule : (fromPattern ? new RegExp(fromPattern).test(edge.from) : true);
              const matchesTo = toModule ? edge.to === toModule : (toPattern ? new RegExp(toPattern).test(edge.to) : true);

              if (matchesFrom && matchesTo) {
                violations.push({
                  id: `VIOLATION_RULE_${rule.id}_${edge.from}_${edge.to}`,
                  kind: 'FORBIDDEN_DEPENDENCY',
                  severity: constraint.severity,
                  source: edge.from,
                  target: edge.to,
                  ruleId: rule.id,
                  constraintId: constraint.id,
                  edgeId: edge.id,
                  message: constraint.description || `Rule ${rule.name} forbids dependency from ${edge.from} to ${edge.to}`
                });
              }
            }
          }
        }
      }
    }

    // 2. Cycle Detection
    const cycles = graph.findCycles(ProjectRelationKind.DEPENDS_ON);
    for (const cycle of cycles) {
      violations.push({
        id: `VIOLATION_CYCLE_${cycle.join('_')}`,
        kind: 'ARCHITECTURAL_CYCLE',
        severity: 'HIGH',
        cycle,
        message: `Cyclic architecture dependency detected: ${cycle.join(' -> ')}`
      });
    }

    const archDependencies = Array.from(layerDependencies.values()).map(d => new ArchitectureDependency(d));

    return {
      timestamp: Date.now(),
      violationCount: violations.length,
      violations,
      architectureDependencies: archDependencies,
      cycles,
      isCompliant: violations.length === 0
    };
  }
}
