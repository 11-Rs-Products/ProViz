/**
 * ConcolicImpactAnalyzer — Integrates Stage 18 concolic execution to discover concrete test inputs exercising changed paths.
 */

import { ConcolicAnalyzer } from '../concolic/ConcolicAnalyzer.js';
import { TestCase } from '../testing/TestCase.js';
import { TestInput } from '../testing/TestInput.js';

export class ConcolicImpactAnalyzer {
    /**
     * Explore concrete inputs for newly reachable or changed branches.
     *
     * @param {string} sourceCode
     * @param {Array<string>} targetBranches
     * @param {object} [options={}]
     * @returns {object} { generatedInputs, testCases }
     */
    static exploreChangedPaths(sourceCode = '', targetBranches = [], options = {}) {
        const analyzer = new ConcolicAnalyzer();
        const artifact = analyzer.analyzeSource(sourceCode, options);
        const testCases = [];

        if (artifact?.explorationTree) {
            // Convert explored leaf nodes to generated test cases
            const leaves = artifact.explorationTree.leaves || [];
            for (let i = 0; i < leaves.length; i++) {
                const leaf = leaves[i];
                testCases.push(new TestCase({
                    id: `concolic_reg_${i}`,
                    targetId: leaf.branchId || targetBranches[0] || 'changed_path',
                    inputs: new TestInput({ bindings: leaf.inputs || {} }),
                    metadata: { concolic: true, branchId: leaf.branchId },
                }));
            }
        }

        return {
            artifact,
            testCases,
        };
    }
}
