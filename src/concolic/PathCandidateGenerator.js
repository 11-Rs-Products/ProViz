/**
 * PathCandidateGenerator — Generates alternative symbolic path candidates by negating branches.
 */

import { BranchNegator } from './BranchNegator.js';

export class PathCandidateGenerator {
    /**
     * Generate alternative path candidates from a concrete execution path.
     * @param {import('./ConcretePath.js').ConcretePath} concretePath
     * @param {object} [options]
     * @param {string} [options.strategy='DFS'] - 'DFS', 'BFS', 'COVERAGE'
     * @returns {Array<import('./SymbolicPathCandidate.js').SymbolicPathCandidate>}
     */
    static generateCandidates(concretePath, { strategy = 'DFS' } = {}) {
        if (!concretePath || !concretePath.pathConstraints || concretePath.pathConstraints.length === 0) {
            return [];
        }

        const candidates = [];
        const numBranches = concretePath.pathConstraints.length;

        // Iterate through branches
        const indices = [];
        for (let i = 0; i < numBranches; i++) indices.push(i);

        if (strategy === 'DFS') {
            // Latest unexplored branch first
            indices.reverse();
        }

        for (const idx of indices) {
            const cand = BranchNegator.negateBranch(concretePath, idx);
            if (cand && cand.negatedPredicate) {
                candidates.push(cand);
            }
        }

        return candidates;
    }
}
