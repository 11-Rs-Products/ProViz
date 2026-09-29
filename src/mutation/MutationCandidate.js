/**
 * MutationCandidate — Immutable representation of a single synthesized code mutation.
 */

import { PatchSet } from '../repair/PatchSet.js';
import { MUTATION_STATUS } from './MutationStatus.js';

export class MutationCandidate {
    /**
     * @param {object} params
     * @param {string} [params.mutantId=null]
     * @param {string} [params.workspaceSnapshotId='snap_default']
     * @param {string} [params.fileId='main.py']
     * @param {object} [params.sourceLocation={ line: 1, col: 1 }]
     * @param {string} params.operatorId
     * @param {string} [params.category='ARITHMETIC']
     * @param {string} params.originalExpression
     * @param {string} params.mutatedExpression
     * @param {PatchSet|object} params.patch
     * @param {object|null} [params.targetNode=null]
     * @param {string} [params.status=MUTATION_STATUS.GENERATED]
     * @param {object} [params.metadata={}]
     */
    constructor({
        mutantId = null,
        workspaceSnapshotId = 'snap_default',
        fileId = 'main.py',
        sourceLocation = { line: 1, col: 1 },
        operatorId = 'OP_MUT',
        category = 'ARITHMETIC',
        originalExpression = '',
        mutatedExpression = '',
        patch = null,
        targetNode = null,
        status = MUTATION_STATUS.GENERATED,
        metadata = {},
    } = {}) {
        this.workspaceSnapshotId = String(workspaceSnapshotId);
        this.fileId = String(fileId);
        this.sourceLocation = Object.freeze({ ...sourceLocation });
        this.operatorId = String(operatorId);
        this.category = String(category);
        this.originalExpression = String(originalExpression ?? '');
        this.mutatedExpression = String(mutatedExpression ?? '');
        this.patch = patch instanceof PatchSet ? patch : new PatchSet(patch || {});
        this.targetNode = targetNode ? Object.freeze({ ...targetNode }) : null;
        this.status = status;
        this.metadata = Object.freeze({ ...metadata });

        const hash = MutationCandidate.computeHash(JSON.stringify({
            snap: this.workspaceSnapshotId,
            file: this.fileId,
            loc: this.sourceLocation,
            op: this.operatorId,
            orig: this.originalExpression,
            mut: this.mutatedExpression,
        }));
        this.mutantId = mutantId || `mutant_${hash}`;
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

    withStatus(status) {
        return new MutationCandidate({
            mutantId: this.mutantId,
            workspaceSnapshotId: this.workspaceSnapshotId,
            fileId: this.fileId,
            sourceLocation: this.sourceLocation,
            operatorId: this.operatorId,
            category: this.category,
            originalExpression: this.originalExpression,
            mutatedExpression: this.mutatedExpression,
            patch: this.patch,
            targetNode: this.targetNode,
            status,
            metadata: this.metadata,
        });
    }

    toJSON() {
        return {
            mutantId: this.mutantId,
            workspaceSnapshotId: this.workspaceSnapshotId,
            fileId: this.fileId,
            sourceLocation: this.sourceLocation,
            operatorId: this.operatorId,
            category: this.category,
            originalExpression: this.originalExpression,
            mutatedExpression: this.mutatedExpression,
            patch: this.patch.toJSON(),
            targetNode: this.targetNode,
            status: this.status,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new MutationCandidate({
            ...json,
            patch: PatchSet.fromJSON(json.patch),
        });
    }
}
