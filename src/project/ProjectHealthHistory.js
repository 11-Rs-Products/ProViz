/**
 * ProjectHealthHistory.js
 * Chronological repository of ProjectHealthSnapshots.
 */

import { ProjectHealthSnapshot } from './ProjectHealthSnapshot.js';

export class ProjectHealthHistory {
  constructor() {
    /** @type {ProjectHealthSnapshot[]} */
    this._snapshots = [];
  }

  addSnapshot(snapshot) {
    const s = snapshot instanceof ProjectHealthSnapshot ? snapshot : new ProjectHealthSnapshot(snapshot);
    this._snapshots.push(s);
    return s;
  }

  getSnapshots() {
    return [...this._snapshots];
  }

  getLatestSnapshot() {
    return this._snapshots.length > 0 ? this._snapshots[this._snapshots.length - 1] : null;
  }

  getSnapshotByRevision(revision) {
    return this._snapshots.find(s => s.revision === revision) || null;
  }

  toJSON() {
    return {
      snapshots: this._snapshots.map(s => s.toJSON())
    };
  }

  static fromJSON(json) {
    const history = new ProjectHealthHistory();
    if (json.snapshots) {
      for (const s of json.snapshots) history.addSnapshot(ProjectHealthSnapshot.fromJSON(s));
    }
    return history;
  }
}
