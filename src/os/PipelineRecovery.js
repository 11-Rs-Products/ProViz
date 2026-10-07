/**
 * PipelineRecovery.js
 * Handles phase failures by triggering targeted recovery strategies or escalating.
 */

export class PipelineRecovery {
  /**
   * Determine recovery action for phase failure
   * @param {string} failedPhase
   * @param {Error|Object} error
   * @param {Object} context
   */
  handleFailure(failedPhase, error, context = {}) {
    let action = 'ESCALATE';
    if (failedPhase === 'REPAIR') {
      action = 'ROLLBACK_AND_REVERIFY';
    } else if (failedPhase === 'VERIFY' && context.allowRetry) {
      action = 'RETRY_WITH_HIGHER_TIMEOUT';
    } else if (failedPhase === 'SYNC_KNOWLEDGE') {
      action = 'RECONCILE_ASYNCHRONOUSLY';
    }

    return {
      failedPhase,
      error: error?.message || String(error),
      action,
      timestamp: Date.now()
    };
  }
}
