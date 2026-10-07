/**
 * ArchitectureAnalyzer.js
 * Analyzes architectural invariants, layer violations, and boundary drift.
 */

import { ArchitectureLayer } from './ArchitectureGraph.js';

export class ArchitectureAnalyzer {
  constructor(rules = []) {
    // Default layered architecture rules (Forbidden directions)
    this.forbiddenRules = rules.length > 0 ? rules : [
      { fromLayer: ArchitectureLayer.INFRASTRUCTURE, toLayer: ArchitectureLayer.DOMAIN, reason: 'Infrastructure must not depend on Domain' },
      { fromLayer: ArchitectureLayer.DATA, toLayer: ArchitectureLayer.API, reason: 'Data layer must not depend on API layer' }
    ];
  }

  analyze(archGraph) {
    const violations = [];
    const nodes = archGraph.getAllNodes();

    for (const node of nodes) {
      const deps = archGraph.getDependencies(node.id);
      for (const depId of deps) {
        const depNode = archGraph.getNode(depId);
        if (!depNode) continue;

        for (const rule of this.forbiddenRules) {
          if (node.layer === rule.fromLayer && depNode.layer === rule.toLayer) {
            violations.push({
              sourceId: node.id,
              targetId: depNode.id,
              fromLayer: node.layer,
              toLayer: depNode.layer,
              reason: rule.reason
            });
          }
        }
      }
    }

    return {
      totalViolations: violations.length,
      violations,
      isClean: violations.length === 0
    };
  }
}
