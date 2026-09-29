/**
 * TestImpactAnalyzer — High-level coordinator for test relevance and impact assessment.
 */

import { ImpactAnalyzer } from './ImpactAnalyzer.js';
import { TestSelector, TEST_SELECTION_STRATEGIES } from './TestSelector.js';

export class TestImpactAnalyzer {
    /**
     * @param {object} [options={}]
     */
    constructor(options = {}) {
        this.options = options;
        this.impactAnalyzer = new ImpactAnalyzer(options);
    }

    /**
     * Analyze test impact for a given change set and test suite.
     *
     * @param {import('./SemanticChangeSet.js').SemanticChangeSet} changeSet
     * @param {import('../workspace/WorkspaceSnapshot.js').WorkspaceSnapshot} snapshot
     * @param {Array<import('../testing/TestCase.js').TestCase>|import('../testing/TestSuite.js').TestSuite} testSuite
     * @param {object} [options={}]
     * @returns {object} { impactResults, selectionPlan }
     */
    analyze(changeSet, snapshot, testSuite = [], options = {}) {
        const impactResults = this.impactAnalyzer.analyze(changeSet, snapshot, testSuite, options);
        const selectionPlan = TestSelector.select(changeSet, testSuite, impactResults, {
            ...this.options,
            ...options,
        });

        return {
            impactResults,
            selectionPlan,
        };
    }
}
