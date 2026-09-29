/**
 * RegressionSession — Manages regression campaigns and snapshot history across workspace revisions.
 */

import { RegressionSnapshot } from './RegressionSnapshot.js';

export class RegressionSession {
    /**
     * @param {object} [params]
     * @param {string} [params.sessionId=null]
     * @param {Array<RegressionSnapshot>} [params.snapshots=[]]
     */
    constructor({ sessionId = null, snapshots = [] } = {}) {
        this.sessionId = sessionId || `session_${Date.now()}`;
        this._snapshots = [...snapshots];
    }

    recordSnapshot(snapshot) {
        if (!snapshot) return;
        const snap = snapshot instanceof RegressionSnapshot ? snapshot : RegressionSnapshot.fromJSON(snapshot);
        this._snapshots.push(snap);
    }

    get latestSnapshot() {
        return this._snapshots.length > 0 ? this._snapshots[this._snapshots.length - 1] : null;
    }

    getAllSnapshots() {
        return [...this._snapshots];
    }

    getSnapshot(snapshotId) {
        return this._snapshots.find(s => s.snapshotId === snapshotId) || null;
    }

    toJSON() {
        return {
            sessionId: this.sessionId,
            snapshots: this._snapshots.map(s => s.toJSON()),
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RegressionSession({
            sessionId: json.sessionId,
            snapshots: (json.snapshots || []).map(s => RegressionSnapshot.fromJSON(s)),
        });
    }
}
