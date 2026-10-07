/**
 * SemanticPreservationAnalyzer.js
 * Compares original and transformed SemanticProgramGraphs to classify semantic shifts:
 * PRESERVED, STRENGTHENED, WEAKENED, CHANGED, UNKNOWN, VIOLATED.
 */

export const SemanticShiftStatus = Object.freeze({
  PRESERVED: 'PRESERVED',
  STRENGTHENED: 'STRENGTHENED',
  WEAKENED: 'WEAKENED',
  CHANGED: 'CHANGED',
  UNKNOWN: 'UNKNOWN',
  VIOLATED: 'VIOLATED'
});

export class SemanticPreservationAnalyzer {
  evaluate(candidate, beforeGraph, afterGraph) {
    if (!beforeGraph || !afterGraph) {
      return { status: SemanticShiftStatus.UNKNOWN, confidence: 0.0 };
    }

    const beforeNode = beforeGraph.getNode ? (beforeGraph.getNode(candidate.transformation.sourceScope) || beforeGraph.getNode(candidate.transformation.targetScope)) : null;
    const afterNode = afterGraph.getNode ? (afterGraph.getNode(candidate.transformation.targetScope) || afterGraph.getNode(candidate.transformation.sourceScope)) : null;

    if (!beforeNode && !afterNode) {
      return { status: SemanticShiftStatus.PRESERVED, confidence: 0.85 };
    }

    if (!afterNode && candidate.transformation.kind !== 'DELETE_SYMBOL') {
      return { status: SemanticShiftStatus.VIOLATED, reason: 'Target node missing after transformation', confidence: 0.95 };
    }

    const beforeSpecs = beforeNode?.specRelationships?.length || 0;
    const afterSpecs = afterNode?.specRelationships?.length || 0;

    let status = SemanticShiftStatus.PRESERVED;
    if (afterSpecs > beforeSpecs) status = SemanticShiftStatus.STRENGTHENED;
    else if (afterSpecs < beforeSpecs) status = SemanticShiftStatus.WEAKENED;

    return {
      status,
      confidence: 0.90,
      beforeSpecs,
      afterSpecs
    };
  }
}
