/**
 * PatchApplicability — Evaluates whether a patch can be safely applied to a workspace or source.
 */

import { PatchValidator } from './PatchValidator.js';

export const APPLICABILITY_STATUS = Object.freeze({
    APPLICABLE: 'APPLICABLE',
    CONFLICT: 'CONFLICT',
    STALE: 'STALE',
    UNSUPPORTED: 'UNSUPPORTED',
    OUT_OF_SCOPE: 'OUT_OF_SCOPE',
});

export class PatchApplicability {
    /**
     * @param {object} params
     * @param {string} params.status
     * @param {Array<string>} [params.reasons=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        status = APPLICABILITY_STATUS.APPLICABLE,
        reasons = [],
        metadata = {},
    } = {}) {
        this.status = status;
        this.reasons = Object.freeze([...reasons]);
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    get isApplicable() {
        return this.status === APPLICABILITY_STATUS.APPLICABLE;
    }

    /**
     * Check applicability of a patch set on a target snapshot or source.
     * @param {import('./PatchSet.js').PatchSet|object} patchSet
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot|string} target
     * @param {object} [options={}]
     * @returns {PatchApplicability}
     */
    static check(patchSet, target, options = {}) {
        const validation = PatchValidator.validate(patchSet, target, options);
        if (validation.valid) {
            return new PatchApplicability({
                status: APPLICABILITY_STATUS.APPLICABLE,
                reasons: [],
            });
        }

        const isStale = validation.errors.some(e => e.includes('Stale patch'));
        const isConflict = validation.errors.some(e => e.includes('Conflicting') || e.includes('mismatch'));

        let status = APPLICABILITY_STATUS.UNSUPPORTED;
        if (isStale) status = APPLICABILITY_STATUS.STALE;
        else if (isConflict) status = APPLICABILITY_STATUS.CONFLICT;

        return new PatchApplicability({
            status,
            reasons: validation.errors,
        });
    }

    toJSON() {
        return {
            status: this.status,
            reasons: this.reasons,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new PatchApplicability(json);
    }
}
