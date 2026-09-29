/**
 * FindingPathPlanner — Plans concolic path exploration targeted at reproducing specific Stage 15/16 findings.
 */

import { FindingTestGenerator } from '../testing/FindingTestGenerator.js';
import { PathCandidateGenerator } from './PathCandidateGenerator.js';

export class FindingPathPlanner {
    /**
     * Plan candidate paths to reproduce a verification finding.
     * @param {object} finding - Stage 15/16 finding
     * @param {Array<import('./ConcretePath.js').ConcretePath>} exploredPaths
     * @returns {Array<import('./SymbolicPathCandidate.js').SymbolicPathCandidate>}
     */
    static planForFinding(finding, exploredPaths = []) {
        if (!finding) return [];

        const candidates = [];
        for (const p of exploredPaths) {
            const pathCands = PathCandidateGenerator.generateCandidates(p, { strategy: 'DFS' });
            candidates.push(...pathCands);
        }

        return candidates;
    }
}
