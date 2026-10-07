/**
 * StateReconciler.js
 * Automatically reconciles drift and merges asynchronous subsystem updates into canonical unified state.
 */

import { StateRevision } from './StateRevision.js';
import { StateTransition } from './StateTransition.js';

export class StateReconciler {
  /**
   * Reconcile current state with pending subsystem updates
   * @param {import('./UnifiedProjectState.js').UnifiedProjectState} currentState
   * @param {Object} pendingUpdates
   * @param {string} cause
   */
  reconcile(currentState, pendingUpdates = {}, cause = 'Subsystem state synchronization') {
    const nextRevision = currentState.revision.next();

    const mergedStateData = {
      projectId: currentState.projectId,
      revision: nextRevision,
      projectModel: pendingUpdates.projectModel || currentState.projectModel,
      runtimeState: pendingUpdates.runtimeState || currentState.runtimeState,
      semanticState: pendingUpdates.semanticState || currentState.semanticState,
      knowledgeState: pendingUpdates.knowledgeState || currentState.knowledgeState,
      verificationState: pendingUpdates.verificationState || currentState.verificationState,
      securityState: pendingUpdates.securityState || currentState.securityState,
      performanceState: pendingUpdates.performanceState || currentState.performanceState,
      concurrencyState: pendingUpdates.concurrencyState || currentState.concurrencyState,
      evolutionState: pendingUpdates.evolutionState || currentState.evolutionState,
      projectIntelligenceState: pendingUpdates.projectIntelligenceState || currentState.projectIntelligenceState,
      governanceState: pendingUpdates.governanceState || currentState.governanceState,
      certificationState: pendingUpdates.certificationState || currentState.certificationState,
      metadata: { ...currentState.metadata, ...(pendingUpdates.metadata || {}) }
    };

    const transition = new StateTransition({
      fromRevision: currentState.revision,
      toRevision: nextRevision,
      cause,
      delta: pendingUpdates
    });

    return {
      mergedStateData,
      transition
    };
  }
}
