/**
 * SafetyInvariantAnalyzer.js
 * Connects Stage 15 verification invariants with adversarial safety exploration.
 */

export class SafetyInvariantAnalyzer {
  /**
   * Evaluates if any safety properties are violated under execution context.
   * @param {Array<SafetyProperty>} safetyProperties
   * @param {Object} executionState
   * @returns {Object}
   */
  evaluateSafety(safetyProperties = [], executionState = {}) {
    const violations = [];

    for (const prop of safetyProperties) {
      if (executionState.violatedPropertyIds?.includes(prop.id)) {
        violations.push(prop);
      } else if (prop.kind === 'MUST_NOT_EXCEED_RESOURCE' && executionState.resourceExceeded) {
        violations.push(prop);
      } else if (prop.kind === 'MUST_NOT_REACH_STATE' && executionState.reachedUnsafeState) {
        violations.push(prop);
      }
    }

    const isSafe = violations.length === 0;

    return {
      isSafe,
      violatedProperties: violations,
      violationCount: violations.length,
      summary: isSafe
        ? 'All safety invariants satisfied'
        : `Safety violation: ${violations.length} safety invariants breached`
    };
  }
}
