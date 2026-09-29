/**
 * MutationSession — Immutable session configuration for mutation campaigns.
 */

import { MUTATION_SESSION_STATUS } from './MutationSessionStatus.js';

export class MutationSession {
    /**
     * @param {object} params
     * @param {string} [params.sessionId=null]
     * @param {string} [params.workspaceSnapshotId='snap_default']
     * @param {number} [params.sourceRevision=1]
     * @param {Array<string>} [params.operators=[]]
     * @param {string} [params.status=MUTATION_SESSION_STATUS.COMPLETED]
     * @param {object} [params.limits={}]
     */
    constructor({
        sessionId = null,
        workspaceSnapshotId = 'snap_default',
        sourceRevision = 1,
        operators = [],
        status = MUTATION_SESSION_STATUS.COMPLETED,
        limits = {},
    } = {}) {
        this.workspaceSnapshotId = String(workspaceSnapshotId);
        this.sourceRevision = Number(sourceRevision) || 1;
        this.operators = Object.freeze([...operators]);
        this.status = status;
        this.limits = Object.freeze({
            maxMutants: 100,
            timeoutMs: 5000,
            ...limits,
        });

        const hash = MutationSession.computeHash(JSON.stringify({
            snap: this.workspaceSnapshotId,
            rev: this.sourceRevision,
            ops: this.operators,
        }));
        this.sessionId = sessionId || `session_mut_${hash}`;
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
            operators: this.operators,
            status: this.status,
            limits: this.limits,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new MutationSession(json);
    }
}
