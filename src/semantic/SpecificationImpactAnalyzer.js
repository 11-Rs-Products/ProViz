/**
 * SpecificationImpactAnalyzer.js
 * Analyzes contract violations, invariant weakening, assumption invalidation,
 * and specification drift across the codebase.
 */

import { SemanticEntityKind } from './SemanticEntityKind.js';
import { DependencyClosure } from './DependencyClosure.js';

export class SpecificationImpactAnalyzer {
  analyze(change, programGraph) {
    const closure = DependencyClosure.buildFromProgramGraph(programGraph);
    const affectedNodeIds = [change.targetId, ...closure.getReverseClosure(change.targetId)];

    const affectedContracts = [];
    const affectedInvariants = [];
    const affectedSpecifications = [];
    let specDriftDetected = false;

    for (const id of affectedNodeIds) {
      const node = programGraph.getNode(id);
      if (!node) continue;

      if (node.kind === SemanticEntityKind.CONTRACT) affectedContracts.push(id);
      else if (node.kind === SemanticEntityKind.INVARIANT) affectedInvariants.push(id);
      else if (node.kind === SemanticEntityKind.SPECIFICATION) affectedSpecifications.push(id);

      if (node.specRelationships && node.specRelationships.length > 0) {
        for (const specId of node.specRelationships) {
          if (!affectedSpecifications.includes(specId)) {
            affectedSpecifications.push(specId);
          }
        }
      }
    }

    if (change.type.includes('SPEC') || change.type.includes('CONTRACT') || (affectedContracts.length === 0 && affectedSpecifications.length === 0)) {
      specDriftDetected = true;
    }

    const driftScore = Math.min(1.0, (affectedContracts.length * 0.3) + (affectedInvariants.length * 0.4) + (specDriftDetected ? 0.3 : 0.0));

    return {
      targetId: change.targetId,
      affectedContracts,
      affectedInvariants,
      affectedSpecifications,
      specDriftDetected,
      driftScore,
      recommendation: driftScore > 0.5 ? 'REVERIFY_CONTRACTS_AND_INVARIANTS' : 'UPDATE_SPEC_COVERAGE'
    };
  }
}
