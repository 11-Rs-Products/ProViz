/**
 * OSLifecycle.js
 * State machine managing safe transitions of ProViz OS runtime states.
 */

import { OSState } from './OSState.js';

export class OSLifecycle {
  /**
   * @param {string} [initialState=OSState.INITIALIZING]
   */
  constructor(initialState = OSState.INITIALIZING) {
    this._currentState = initialState;
    this._history = [{ state: initialState, timestamp: Date.now(), reason: 'boot' }];
  }

  get state() {
    return this._currentState;
  }

  get history() {
    return [...this._history];
  }

  transitionTo(nextState, reason = '') {
    const validTransitions = {
      [OSState.INITIALIZING]: [OSState.READY, OSState.FAILED_SAFE],
      [OSState.READY]: [OSState.OBSERVING, OSState.ANALYZING, OSState.PLANNING, OSState.VERIFYING, OSState.PAUSED, OSState.SHUTTING_DOWN, OSState.FAILED_SAFE],
      [OSState.OBSERVING]: [OSState.ANALYZING, OSState.READY, OSState.PAUSED, OSState.ESCALATED, OSState.FAILED_SAFE],
      [OSState.ANALYZING]: [OSState.PLANNING, OSState.VERIFYING, OSState.READY, OSState.PAUSED, OSState.ESCALATED, OSState.FAILED_SAFE],
      [OSState.PLANNING]: [OSState.VERIFYING, OSState.REPAIRING, OSState.READY, OSState.PAUSED, OSState.ESCALATED, OSState.FAILED_SAFE],
      [OSState.VERIFYING]: [OSState.REPAIRING, OSState.GOVERNING, OSState.CERTIFYING, OSState.READY, OSState.PAUSED, OSState.ESCALATED, OSState.FAILED_SAFE],
      [OSState.REPAIRING]: [OSState.REVERIFYING, OSState.READY, OSState.ESCALATED, OSState.RECOVERING, OSState.FAILED_SAFE],
      [OSState.REVERIFYING]: [OSState.GOVERNING, OSState.CERTIFYING, OSState.REPAIRING, OSState.READY, OSState.ESCALATED, OSState.FAILED_SAFE],
      [OSState.GOVERNING]: [OSState.CERTIFYING, OSState.READY, OSState.ESCALATED, OSState.FAILED_SAFE],
      [OSState.CERTIFYING]: [OSState.READY, OSState.OBSERVING, OSState.FAILED_SAFE],
      [OSState.PAUSED]: [OSState.READY, OSState.OBSERVING, OSState.VERIFYING, OSState.SHUTTING_DOWN, OSState.FAILED_SAFE],
      [OSState.ESCALATED]: [OSState.READY, OSState.REPAIRING, OSState.RECOVERING, OSState.FAILED_SAFE],
      [OSState.RECOVERING]: [OSState.READY, OSState.OBSERVING, OSState.FAILED_SAFE],
      [OSState.SHUTTING_DOWN]: [OSState.STOPPED, OSState.FAILED_SAFE],
      [OSState.STOPPED]: [OSState.INITIALIZING],
      [OSState.FAILED_SAFE]: [OSState.RECOVERING, OSState.STOPPED]
    };

    const allowed = validTransitions[this._currentState] || [OSState.FAILED_SAFE];
    if (!allowed.includes(nextState)) {
      throw new Error(`Invalid OS lifecycle transition from ${this._currentState} to ${nextState}`);
    }

    this._currentState = nextState;
    this._history.push({ state: nextState, timestamp: Date.now(), reason });
    return this._currentState;
  }

  toJSON() {
    return {
      currentState: this._currentState,
      history: this._history
    };
  }
}
