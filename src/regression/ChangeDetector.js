/**
 * ChangeDetector — Orchestrator for detecting semantic changes across workspace snapshots.
 */

import { SemanticDiff } from './SemanticDiff.js';

export class ChangeDetector {
    /**
     * @param {object} [options={}]
     */
    constructor(options = {}) {
        this.options = options;
    }

    /**
     * Detect all semantic changes between two snapshots.
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} beforeSnapshot
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} afterSnapshot
     * @returns {import('./SemanticChangeSet.js').SemanticChangeSet}
     */
    detect(beforeSnapshot, afterSnapshot) {
        const diffResult = SemanticDiff.diff(beforeSnapshot, afterSnapshot, this.options);
        return diffResult.changeSet;
    }
}
