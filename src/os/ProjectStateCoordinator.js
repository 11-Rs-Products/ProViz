/**
 * ProjectStateCoordinator.js
 * Tracks unified state lineage, records transitions, and exposes immutable state snapshots.
 */

import { UnifiedProjectState } from './UnifiedProjectState.js';
import { StateRevision } from './StateRevision.js';
import { StateReconciler } from './StateReconciler.js';
import { StateConsistencyValidator } from './StateConsistencyValidator.js';

export class ProjectStateCoordinator {
  /**
   * @param {Object} [options]
   * @param {string} [options.projectId='default_project']
   * @param {UnifiedProjectState} [options.initialState]
   */
  constructor(options = {}) {
    this.projectId = options.projectId || 'default_project';
    this._currentState = options.initialState || new UnifiedProjectState({
      projectId: this.projectId,
      revision: new StateRevision({ sequenceNumber: 0 })
    });
    this._history = [this._currentState];
    this._transitions = [];
    this._reconciler = new StateReconciler();
    this._validator = new StateConsistencyValidator();
  }

  getState() {
    return this._currentState;
  }

  getRevision() {
    return this._currentState.revision;
  }

  getTransitions() {
    return [...this._transitions];
  }

  updateState(pendingUpdates = {}, cause = 'Autonomous state transition') {
    const { mergedStateData, transition } = this._reconciler.reconcile(this._currentState, pendingUpdates, cause);
    const nextState = new UnifiedProjectState(mergedStateData);

    const validation = this._validator.validate(nextState);
    if (!validation.isValid) {
      console.warn('[ProjectStateCoordinator] State validation warnings:', validation.inconsistencies);
    }

    this._currentState = nextState;
    this._history.push(nextState);
    this._transitions.push(transition);
    return this._currentState;
  }

  rollbackToRevision(sequenceNumber) {
    const targetState = this._history.find(s => s.revision.sequenceNumber === sequenceNumber);
    if (!targetState) {
      throw new Error(`Revision sequence ${sequenceNumber} not found in state history`);
    }

    const nextRev = this._currentState.revision.next();
    const rolledBackState = new UnifiedProjectState({
      ...targetState,
      revision: nextRev,
      metadata: { ...targetState.metadata, rolledBackFrom: this._currentState.revision.sequenceNumber }
    });

    this._currentState = rolledBackState;
    this._history.push(rolledBackState);
    return this._currentState;
  }

  toJSON() {
    return {
      projectId: this.projectId,
      currentState: this._currentState.toJSON(),
      historyLength: this._history.length,
      transitions: this._transitions.map(t => t.toJSON())
    };
  }
}
