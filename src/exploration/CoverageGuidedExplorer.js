/**
 * CoverageGuidedExplorer — Prioritizes exploration inputs targeting uncovered branches and paths.
 */

import { CoverageFeedback } from './CoverageFeedback.js';

export class CoverageGuidedExplorer {
    constructor() {
        this.coveredBranches = new Set();
        this.coveredPaths = new Set();
    }

    /**
     * @param {object} outcome
     * @returns {CoverageFeedback}
     */
    evaluateOutcome(outcome) {
        const branches = outcome.coveredBranches || outcome.coveredLines || [];
        const path = outcome.pathId || outcome.symbolicPathId || null;

        const newBranches = [];
        for (const b of branches) {
            if (!this.coveredBranches.has(b)) {
                this.coveredBranches.add(b);
                newBranches.push(b);
            }
        }

        const newPaths = [];
        if (path && !this.coveredPaths.has(path)) {
            this.coveredPaths.add(path);
            newPaths.push(path);
        }

        const gain = (newBranches.length * 0.1) + (newPaths.length * 0.2);
        return new CoverageFeedback({
            newBranches,
            newPaths,
            coverageGain: Math.min(1.0, gain),
        });
    }
}
