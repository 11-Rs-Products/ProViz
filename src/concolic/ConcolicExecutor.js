/**
 * ConcolicExecutor — Executes concrete inputs and extracts / compares observed paths with symbolic predictions.
 */

import { TestExecutor } from '../testing/TestExecutor.js';
import { TestValidator } from '../testing/TestValidator.js';
import { PathExtractor } from './PathExtractor.js';
import { PathComparator } from './PathComparator.js';
import { ModelRefinement, REFINEMENT_KINDS } from './ModelRefinement.js';

export class ConcolicExecutor {
    /**
     * @param {object} [options]
     * @param {TestExecutor} [options.testExecutor]
     */
    constructor({ testExecutor = new TestExecutor() } = {}) {
        this.testExecutor = testExecutor;
    }

    /**
     * Execute a TestCase and extract concolic path and divergence records.
     * @param {import('../testing/TestCase.js').TestCase} testCase
     * @param {string} sourceCode
     * @param {object} [options]
     * @param {import('../analysis/ControlFlowGraph.js').ControlFlowGraph|null} [options.cfg=null]
     * @param {import('./SymbolicPathCandidate.js').SymbolicPathCandidate|null} [options.candidate=null]
     * @returns {object} - { concretePath, observation, testResult, divergence, refinement }
     */
    execute(testCase, sourceCode, { cfg = null, candidate = null } = {}) {
        const obs = this.testExecutor.execute(testCase, sourceCode);
        const testResult = TestValidator.validate(testCase, obs);
        const concretePath = PathExtractor.extract({ observation: obs, cfg, testCaseId: testCase.id });

        let divergence = null;
        let refinement = null;

        if (candidate) {
            const comp = PathComparator.compare(candidate, concretePath);
            if (!comp.matches) {
                divergence = comp.divergence;
                refinement = new ModelRefinement({
                    kind: REFINEMENT_KINDS.MISSING_RELATION,
                    divergenceId: divergence?.id || 'div_unknown',
                    description: `Predicted branch not taken in execution: ${divergence?.reason}`,
                });
            }
        }

        return {
            concretePath,
            observation: obs,
            testResult,
            divergence,
            refinement,
        };
    }
}
