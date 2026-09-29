/**
 * TestSelector — Executes test selection strategies against the ImpactGraph and TestSuite.
 */

import { TestSelectionPlan } from './TestSelectionPlan.js';
import { TestRelevance, TEST_RELEVANCE_LEVELS } from './TestRelevance.js';
import { TestPrioritizer } from './TestPrioritizer.js';

export const TEST_SELECTION_STRATEGIES = Object.freeze({
    ALL: 'ALL',
    DIRECT_IMPACT: 'DIRECT_IMPACT',
    TRANSITIVE_IMPACT: 'TRANSITIVE_IMPACT',
    COVERAGE_BASED: 'COVERAGE_BASED',
    DATAFLOW_BASED: 'DATAFLOW_BASED',
    CONTROL_FLOW_BASED: 'CONTROL_FLOW_BASED',
    TYPE_BASED: 'TYPE_BASED',
    SYMBOLIC: 'SYMBOLIC',
    CONCOLIC: 'CONCOLIC',
    MUTATION_GUIDED: 'MUTATION_GUIDED',
    RISK_BASED: 'RISK_BASED',
    HYBRID: 'HYBRID',
});

export class TestSelector {
    /**
     * Select regression tests based on change impact and selected strategy.
     *
     * @param {import('./SemanticChangeSet.js').SemanticChangeSet} changeSet
     * @param {Array<import('../testing/TestCase.js').TestCase>|import('../testing/TestSuite.js').TestSuite} testSuite
     * @param {object} [impactResults=null] - Output from ImpactAnalyzer.analyze
     * @param {object} [options={}]
     * @returns {TestSelectionPlan}
     */
    static select(changeSet, testSuite, impactResults = null, options = {}) {
        const strategy = options.strategy || TEST_SELECTION_STRATEGIES.HYBRID;
        const allTests = Array.isArray(testSuite) ? testSuite : (testSuite?.testCases || []);
        const maxSelected = Number(options.maxSelectedTests) || 10000;

        const impactedMap = impactResults?.propagation?.impactedNodes || new Map();
        const affectedFuncs = new Set((impactResults?.affectedFunctions || []).map(f => f.functionName));
        const affectedSyms = new Set((impactResults?.affectedSymbols || []).map(s => s.symbolName));

        const selected = [];
        const deselected = [];

        for (const test of allTests) {
            const tId = test.id;
            let isSelected = false;
            let relevanceLevel = TEST_RELEVANCE_LEVELS.UNRELATED;
            const reasons = [];
            const impactedEntities = [];
            let depth = 999;

            if (strategy === TEST_SELECTION_STRATEGIES.ALL) {
                isSelected = true;
                relevanceLevel = TEST_RELEVANCE_LEVELS.COVERAGE_RELATED;
                reasons.push('Full regression test suite selected');
            } else {
                // Check direct impact in graph
                if (impactedMap.has(tId)) {
                    const entry = impactedMap.get(tId);
                    isSelected = true;
                    relevanceLevel = entry.depth === 1 ? TEST_RELEVANCE_LEVELS.DIRECTLY_AFFECTED : TEST_RELEVANCE_LEVELS.INDIRECTLY_AFFECTED;
                    reasons.push(...entry.reasons);
                    depth = entry.depth;
                }

                // Check target function or symbol match
                if (test.targetId) {
                    if (affectedFuncs.has(test.targetId)) {
                        isSelected = true;
                        relevanceLevel = TEST_RELEVANCE_LEVELS.DIRECTLY_AFFECTED;
                        reasons.push(`Covers affected target function '${test.targetId}'`);
                        impactedEntities.push(test.targetId);
                        depth = Math.min(depth, 1);
                    }
                    if (affectedSyms.has(test.targetId)) {
                        isSelected = true;
                        reasons.push(`Covers affected target symbol '${test.targetId}'`);
                        impactedEntities.push(test.targetId);
                        depth = Math.min(depth, 1);
                    }
                }

                // Strategy specific filters
                if (strategy === TEST_SELECTION_STRATEGIES.DIRECT_IMPACT && depth > 1) {
                    isSelected = false;
                }
            }

            if (isSelected) {
                selected.push(new TestRelevance({
                    testId: tId,
                    relevance: relevanceLevel,
                    reasons,
                    impactedEntities,
                    metadata: { depth: depth === 999 ? 0 : depth },
                }));
            } else {
                deselected.push(tId);
            }
        }

        // Deterministically prioritize selected tests
        const prioritized = TestPrioritizer.prioritize(selected, options.weights || {}).slice(0, maxSelected);

        return new TestSelectionPlan({
            strategy,
            selectedTests: prioritized,
            deselectedTests: deselected,
            metadata: {
                totalCandidates: allTests.length,
                strategy,
                timestamp: Date.now(),
            },
        });
    }
}
