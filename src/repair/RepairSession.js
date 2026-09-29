/**
 * RepairSession — Immutable configuration and identity of a program repair session.
 */

export class RepairSession {
    /**
     * @param {object} params
     * @param {string} [params.sessionId=null]
     * @param {string} [params.workspaceSnapshotId='snapshot_default']
     * @param {number} [params.sourceRevision=1]
     * @param {string} [params.targetFindingId=null]
     * @param {Array<string>} [params.strategies=[]]
     * @param {object} [params.limits={}]
     */
    constructor({
        sessionId = null,
        workspaceSnapshotId = 'snapshot_default',
        sourceRevision = 1,
        targetFindingId = null,
        strategies = [],
        limits = {},
    } = {}) {
        this.workspaceSnapshotId = String(workspaceSnapshotId);
        this.sourceRevision = Number(sourceRevision) || 1;
        this.targetFindingId = targetFindingId ? String(targetFindingId) : null;
        this.strategies = Object.freeze([...strategies]);
        this.limits = Object.freeze({
            maxCandidates: 10,
            maxEditsPerPatch: 5,
            timeoutMs: 5000,
            ...limits,
        });

        const hash = RepairSession.computeHash(JSON.stringify({
            snap: this.workspaceSnapshotId,
            rev: this.sourceRevision,
            target: this.targetFindingId,
        }));
        this.sessionId = sessionId || `session_repair_${hash}`;
        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    toJSON() {
        return {
            sessionId: this.sessionId,
            workspaceSnapshotId: this.workspaceSnapshotId,
            sourceRevision: this.sourceRevision,
            targetFindingId: this.targetFindingId,
            strategies: this.strategies,
            limits: this.limits,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RepairSession(json);
    }
}
