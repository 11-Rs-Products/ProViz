/**
 * MutationImpactAnalyzer — Integrates Stage 20 mutation testing into change impact and test prioritization.
 */

import { MutationSiteAnalyzer } from '../mutation/MutationSiteAnalyzer.js';
import { MutationGenerator } from '../mutation/MutationGenerator.js';

export class MutationImpactAnalyzer {
    /**
     * Compute mutation impact for a modified source file or change set.
     *
     * @param {string} sourceCode
     * @param {import('./SemanticChangeSet.js').SemanticChangeSet|null} [changeSet=null]
     * @param {Array<import('../testing/TestCase.js').TestCase>} [testSuite=[]]
     * @returns {object}
     */
    static analyze(sourceCode = '', changeSet = null, testSuite = []) {
        const sites = MutationSiteAnalyzer.findSites(sourceCode);
        const mutants = MutationGenerator.generateMutations(sourceCode);

        // Find mutants located in changed lines
        const impactedMutants = [];
        const changedLines = new Set();

        if (changeSet) {
            for (const c of changeSet.changes) {
                if (c.sourceLocationAfter) {
                    for (let l = c.sourceLocationAfter.startLine; l <= c.sourceLocationAfter.endLine; l++) {
                        changedLines.add(l);
                    }
                }
            }
        }

        for (const m of mutants) {
            if (changedLines.size === 0 || changedLines.has(m.site?.line)) {
                impactedMutants.push(m);
            }
        }

        return {
            totalMutants: mutants.length,
            impactedMutantsCount: impactedMutants.length,
            impactedMutants,
            recommendedTests: testSuite.filter(t => t.targetId && impactedMutants.some(m => m.site?.line === t.metadata?.line)),
        };
    }
}
