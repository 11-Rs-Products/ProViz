/**
 * PatchSet — Immutable collection of structural source edits.
 */

import { Patch } from './Patch.js';
import { WorkspaceSnapshot } from '../workspace/WorkspaceSnapshot.js';
import { SourceFile } from '../workspace/SourceFile.js';

export class PatchSet {
    /**
     * @param {object} params
     * @param {Array<Patch|object>} [params.edits=[]]
     * @param {string} [params.patchSetId=null]
     */
    constructor({
        edits = [],
        patchSetId = null,
    } = {}) {
        this.edits = Object.freeze(edits.map(e => e instanceof Patch ? e : new Patch(e)));

        const hash = PatchSet.computeHash(JSON.stringify(this.edits.map(e => e.patchId)));
        this.patchSetId = patchSetId || `patchset_${hash}`;
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

    /**
     * Apply this patch set to a WorkspaceSnapshot or a raw source code string.
     * @param {WorkspaceSnapshot|string} target
     * @returns {WorkspaceSnapshot|string}
     */
    apply(target) {
        if (typeof target === 'string') {
            return this._applyToString(target);
        }

        if (target instanceof WorkspaceSnapshot) {
            const newFiles = [];
            for (const file of target.getAllFiles()) {
                const fileEdits = this.edits.filter(e => e.fileId === file.id || e.fileId === file.path);
                if (fileEdits.length === 0) {
                    newFiles.push(file);
                } else {
                    const modifiedContent = this._applyEditsToString(file.content, fileEdits);
                    newFiles.push(new SourceFile({
                        id: file.id,
                        path: file.path,
                        content: modifiedContent,
                        isEntry: file.isEntry,
                        version: file.version + 1,
                    }));
                }
            }

            return new WorkspaceSnapshot({
                workspaceId: target.workspaceId,
                version: target.version + 1,
                files: newFiles,
                moduleGraph: target._moduleGraph,
                metadata: {
                    ...target.metadata,
                    appliedPatchSetId: this.patchSetId,
                },
            });
        }

        throw new Error('[PatchSet] Unsupported target for apply. Expected WorkspaceSnapshot or string.');
    }

    /**
     * Internal string modifier sorting edits in reverse line order.
     * @private
     */
    _applyToString(sourceCode) {
        return this._applyEditsToString(sourceCode, this.edits);
    }

    _applyEditsToString(sourceCode, edits) {
        // Sort edits in descending line/column order to avoid offsetting earlier ranges
        const sorted = [...edits].sort((a, b) => {
            if (b.startLine !== a.startLine) return b.startLine - a.startLine;
            return b.startColumn - a.startColumn;
        });

        let current = String(sourceCode || '');
        for (const edit of sorted) {
            current = edit.applyToString(current);
        }
        return current;
    }

    /**
     * Create an inverse PatchSet that reverts these edits.
     * @returns {PatchSet}
     */
    reverse() {
        const reversedEdits = this.edits.map(e => e.reverse()).reverse();
        return new PatchSet({ edits: reversedEdits });
    }

    /**
     * Compose with another patch set.
     * @param {PatchSet} other
     * @returns {PatchSet}
     */
    compose(other) {
        return new PatchSet({
            edits: [...this.edits, ...other.edits],
        });
    }

    /**
     * Check if this patch set conflicts with another patch set.
     * @param {PatchSet} other
     * @returns {boolean}
     */
    conflictsWith(other) {
        for (const e1 of this.edits) {
            for (const e2 of other.edits) {
                if (e1.conflictsWith(e2)) {
                    return true;
                }
            }
        }
        return false;
    }

    serialize() {
        return JSON.stringify(this.toJSON());
    }

    toJSON() {
        return {
            patchSetId: this.patchSetId,
            edits: this.edits.map(e => e.toJSON()),
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new PatchSet({
            patchSetId: json.patchSetId,
            edits: (json.edits || []).map(e => Patch.fromJSON(e)),
        });
    }
}
