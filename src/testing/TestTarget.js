/**
 * TestTarget — Immutable target descriptor for test generation.
 */

import { TEST_TARGET_KINDS } from './TestTargetKind.js';

export class TestTarget {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.kind - One of TEST_TARGET_KINDS
     * @param {string} params.targetId - ID of finding, path, branch, property, etc.
     * @param {object|null} [params.sourceLocation=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        kind = TEST_TARGET_KINDS.FINDING,
        targetId,
        sourceLocation = null,
        metadata = {},
    } = {}) {
        this.kind = kind;
        this.targetId = String(targetId || '');
        this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
        this.metadata = Object.freeze({ ...metadata });
        this.id = id || `target_${this.kind.toLowerCase()}_${this.targetId}`;
        Object.freeze(this);
    }

    toJSON() {
        return {
            id: this.id,
            kind: this.kind,
            targetId: this.targetId,
            sourceLocation: this.sourceLocation,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TestTarget(json);
    }
}
