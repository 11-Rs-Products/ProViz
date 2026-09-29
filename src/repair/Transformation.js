/**
 * Transformation — High-level semantic transformation specification.
 */

import { PatchSet } from './PatchSet.js';

export class Transformation {
    /**
     * @param {object} params
     * @param {string} [params.transformationId=null]
     * @param {string} params.kind - Transformation kind (e.g. 'NULL_GUARD', 'DIVISION_GUARD')
     * @param {object} params.sourceLocation - Target source location { fileId, line, col }
     * @param {string} [params.precondition=''] - Required condition for transformation
     * @param {PatchSet|object} params.edits - Associated PatchSet
     * @param {string} [params.expectedEffect=''] - Intended behavioral outcome
     * @param {object} [params.metadata={}]
     */
    constructor({
        transformationId = null,
        kind = 'GENERIC',
        sourceLocation = {},
        precondition = '',
        edits = null,
        expectedEffect = '',
        metadata = {},
    } = {}) {
        this.kind = String(kind);
        this.sourceLocation = Object.freeze({ ...sourceLocation });
        this.precondition = String(precondition || '');
        this.edits = edits instanceof PatchSet ? edits : new PatchSet(edits || {});
        this.expectedEffect = String(expectedEffect || '');
        this.metadata = Object.freeze({ ...metadata });

        const hash = Transformation.computeHash(JSON.stringify({
            kind: this.kind,
            loc: this.sourceLocation,
            pre: this.precondition,
            edits: this.edits.patchSetId,
        }));
        this.transformationId = transformationId || `trans_${hash}`;
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
            transformationId: this.transformationId,
            kind: this.kind,
            sourceLocation: this.sourceLocation,
            precondition: this.precondition,
            edits: this.edits.toJSON(),
            expectedEffect: this.expectedEffect,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Transformation({
            ...json,
            edits: PatchSet.fromJSON(json.edits),
        });
    }
}
