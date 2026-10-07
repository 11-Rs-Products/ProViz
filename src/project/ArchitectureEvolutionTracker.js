/**
 * ArchitectureEvolutionTracker.js
 * Tracks the multi-revision history of architectural drifts and structural modifications.
 */

import { ArchitectureDrift } from './ArchitectureDrift.js';

export class ArchitectureEvolutionTracker {
  constructor() {
    /** @type {ArchitectureDrift[]} */
    this._driftHistory = [];
  }

  recordDrift(drift) {
    const record = drift instanceof ArchitectureDrift ? drift : new ArchitectureDrift(drift);
    this._driftHistory.push(record);
    return record;
  }

  getHistory() {
    return [...this._driftHistory];
  }

  getLatestDrift() {
    return this._driftHistory.length > 0 ? this._driftHistory[this._driftHistory.length - 1] : null;
  }

  getDriftTrend() {
    const counts = { NONE: 0, MINOR: 0, MODERATE: 0, MAJOR: 0, CRITICAL: 0 };
    for (const drift of this._driftHistory) {
      if (counts[drift.severity] !== undefined) {
        counts[drift.severity]++;
      }
    }
    return {
      totalDriftsRecorded: this._driftHistory.length,
      severityCounts: counts,
      hasRecentRegressions: this._driftHistory.slice(-3).some(d => d.severity === 'MAJOR' || d.severity === 'CRITICAL')
    };
  }

  toJSON() {
    return {
      driftHistory: this._driftHistory.map(d => d.toJSON())
    };
  }

  static fromJSON(json) {
    const tracker = new ArchitectureEvolutionTracker();
    if (json.driftHistory) {
      for (const d of json.driftHistory) {
        tracker.recordDrift(ArchitectureDrift.fromJSON(d));
      }
    }
    return tracker;
  }
}
