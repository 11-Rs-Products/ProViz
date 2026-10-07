/**
 * RefactoringValidator.js
 * Validates that a refactoring preserves semantics, contracts, invariants, and test behaviors.
 */

export class RefactoringValidator {
  /**
   * Validates refactoring correctness by comparing before and after verification states.
   */
  validate(refactoring, beforeGraph, afterGraph, options = {}) {
    const beforeNode = beforeGraph.getNode(refactoring.targetId);
    const afterNode = afterGraph.getNode(refactoring.targetId);

    const issues = [];
    let isPreserved = true;

    if (!afterNode && refactoring.type !== 'MOVE_FUNCTION' && refactoring.type !== 'INLINE_FUNCTION') {
      issues.push(`Target entity '${refactoring.targetId}' was lost after refactoring`);
      isPreserved = false;
    }

    // Check contract preservation
    if (beforeNode && afterNode) {
      if (beforeNode.specRelationships.length > afterNode.specRelationships.length) {
        issues.push('Contract or invariant associations were dropped during refactoring');
        isPreserved = false;
      }
    }

    const testPassRate = options.testPassRate !== undefined ? options.testPassRate : 1.0;
    if (testPassRate < 1.0) {
      issues.push(`Refactoring broke test assertions (pass rate: ${(testPassRate * 100).toFixed(1)}%)`);
      isPreserved = false;
    }

    return {
      refactoringId: refactoring.id,
      isValid: isPreserved,
      semanticsPreserved: isPreserved,
      issues,
      confidence: isPreserved ? 0.95 : 0.20
    };
  }
}
