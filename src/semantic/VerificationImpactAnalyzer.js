/**
 * VerificationImpactAnalyzer.js
 * Analyzes invalidated formal proofs, stale empirical evidence, and affected mutants/repairs.
 */

import { SemanticEntityKind } from './SemanticEntityKind.js';
import { DependencyClosure } from './DependencyClosure.js';

export class VerificationImpactAnalyzer {
  analyze(change, programGraph) {
    const closure = DependencyClosure.buildFromProgramGraph(programGraph);
    const affectedNodeIds = [change.targetId, ...closure.getReverseClosure(change.targetId)];

    const invalidatedProofs = [];
    const staleEvidence = [];
    const affectedMutants = [];
    const affectedRepairs = [];
    const affectedCounterexamples = [];

    for (const id of affectedNodeIds) {
      const node = programGraph.getNode(id);
      if (!node) continue;

      if (node.kind === SemanticEntityKind.PROOF) invalidatedProofs.push(id);
      else if (node.kind === SemanticEntityKind.EVIDENCE) staleEvidence.push(id);
      else if (node.kind === SemanticEntityKind.MUTANT) affectedMutants.push(id);
      else if (node.kind === SemanticEntityKind.REPAIR) affectedRepairs.push(id);
      else if (node.kind === SemanticEntityKind.COUNTEREXAMPLE) affectedCounterexamples.push(id);
    }

    const needsFormalReverification = invalidatedProofs.length > 0;
    const needsMutationTesting = affectedMutants.length > 0;

    return {
      targetId: change.targetId,
      invalidatedProofs,
      staleEvidence,
      affectedMutants,
      affectedRepairs,
      affectedCounterexamples,
      needsFormalReverification,
      needsMutationTesting,
      summary: `Invalidated ${invalidatedProofs.length} proofs, marked ${staleEvidence.length} evidence stale`
    };
  }
}
