/**
 * MutationFilter — Filters redundant, duplicate, or invalid mutation candidates.
 */

import { PatchValidator } from '../repair/PatchValidator.js';

export class MutationFilter {
    /**
     * Filter an array of MutationCandidate objects.
     *
     * @param {Array<import('./MutationCandidate.js').MutationCandidate>} candidates
     * @param {string|import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} workspace
     * @param {object} [options={}]
     * @returns {Array<import('./MutationCandidate.js').MutationCandidate>}
     */
    static filter(candidates, workspace, options = {}) {
        const validCandidates = [];
        const seenSignatures = new Set();

        for (const cand of candidates) {
            // 1. Signature deduplication
            const signature = `${cand.fileId}:${cand.sourceLocation.line}:${cand.sourceLocation.col}:${cand.operatorId}:${cand.mutatedExpression}`;
            if (seenSignatures.has(signature)) continue;
            seenSignatures.add(signature);

            // 2. Patch validation against workspace/source
            const validation = PatchValidator.validate(cand.patch, workspace);
            if (!validation.valid) continue;

            // 3. Category filters
            if (options.categories && !options.categories.includes(cand.category)) {
                continue;
            }

            validCandidates.push(cand);
        }

        return validCandidates;
    }
}
