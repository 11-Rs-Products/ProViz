/**
 * StateConsistencyValidator.js
 * Validates cross-subsystem consistency across runtime, semantic, knowledge, verification, and governance states.
 */

export class StateConsistencyValidator {
  /**
   * @param {import('./UnifiedProjectState.js').UnifiedProjectState} unifiedState
   */
  validate(unifiedState) {
    if (!unifiedState) throw new Error('StateConsistencyValidator requires unifiedState');
    const inconsistencies = [];

    // Check revision consistency
    if (unifiedState.revision.sequenceNumber < 0) {
      inconsistencies.push('Negative revision sequence number');
    }

    // Check project model graph presence
    if (!unifiedState.projectModel) {
      inconsistencies.push('Missing project model');
    }

    // Check evidence freshness vs stale obligations
    const verif = unifiedState.verificationState;
    if (verif && verif.staleObligations > 0 && unifiedState.governanceState?.isApprovedForRelease) {
      inconsistencies.push('Governance approved release despite stale verification obligations');
    }

    return {
      isValid: inconsistencies.length === 0,
      inconsistencies,
      timestamp: Date.now()
    };
  }
}
