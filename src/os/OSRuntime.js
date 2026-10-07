/**
 * OSRuntime.js
 * Manages the active event processing loop, ticker, and background worker lifecycle.
 */

import { OSLifecycle } from './OSLifecycle.js';
import { OSState } from './OSState.js';

export class OSRuntime {
  /**
   * @param {Object} [options]
   * @param {OSLifecycle} [options.lifecycle]
   */
  constructor(options = {}) {
    this.lifecycle = options.lifecycle || new OSLifecycle(OSState.INITIALIZING);
    this._isRunning = false;
    this._isPaused = false;
    this._intervalHandle = null;
    this._tickCount = 0;
    this._tickListeners = [];
  }

  get state() {
    return this.lifecycle.state;
  }

  get isRunning() {
    return this._isRunning;
  }

  get isPaused() {
    return this._isPaused;
  }

  get tickCount() {
    return this._tickCount;
  }

  start() {
    if (this._isRunning) return;
    if (this.lifecycle.state === OSState.INITIALIZING) {
      this.lifecycle.transitionTo(OSState.READY, 'Runtime boot completed');
    }
    this._isRunning = true;
    this._isPaused = false;
  }

  pause() {
    if (!this._isRunning || this._isPaused) return;
    this.lifecycle.transitionTo(OSState.PAUSED, 'User paused runtime');
    this._isPaused = true;
  }

  resume() {
    if (!this._isRunning || !this._isPaused) return;
    this.lifecycle.transitionTo(OSState.READY, 'User resumed runtime');
    this._isPaused = false;
  }

  stop() {
    if (!this._isRunning) return;
    if (this._intervalHandle) {
      clearInterval(this._intervalHandle);
      this._intervalHandle = null;
    }
    this.lifecycle.transitionTo(OSState.SHUTTING_DOWN, 'Graceful shutdown');
    this.lifecycle.transitionTo(OSState.STOPPED, 'Runtime stopped');
    this._isRunning = false;
    this._isPaused = false;
  }

  enterSafeMode(reason = 'Critical anomaly') {
    this.lifecycle.transitionTo(OSState.FAILED_SAFE, reason);
    this._isPaused = true;
  }

  recover(reason = 'Safe mode recovery') {
    if (this.lifecycle.state === OSState.FAILED_SAFE) {
      this.lifecycle.transitionTo(OSState.RECOVERING, reason);
      this.lifecycle.transitionTo(OSState.READY, 'Recovery completed');
      this._isPaused = false;
    }
  }

  onTick(fn) {
    this._tickListeners.push(fn);
  }

  tick() {
    if (!this._isRunning || this._isPaused) return;
    this._tickCount++;
    for (const listener of this._tickListeners) {
      try {
        listener(this._tickCount);
      } catch (err) {
        console.error('[OSRuntime] Tick listener error:', err);
      }
    }
  }

  toJSON() {
    return {
      state: this.state,
      isRunning: this._isRunning,
      isPaused: this._isPaused,
      tickCount: this._tickCount,
      lifecycle: this.lifecycle.toJSON()
    };
  }
}
