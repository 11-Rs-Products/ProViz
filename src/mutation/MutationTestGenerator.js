/**
 * MutationTestGenerator — Synthesizes Stage 17 TestCase instances targeted to kill surviving mutants.
 */

import { TestCase } from '../testing/TestCase.js';
import { TestInput } from '../testing/TestInput.js';
import { DifferentialSymbolicAnalyzer } from './DifferentialSymbolicAnalyzer.js';

export class MutationTestGenerator {
    /**
     * Generate a targeted test case for a surviving mutant.
     *
     * @param {import('./MutationCandidate.js').MutationCandidate} candidate
     * @param {string} originalSource
     * @returns {TestCase}
     */
    static generateTestForMutant(candidate, originalSource) {
        const mutatedSource = candidate.patch.apply(originalSource);
        const diffAnalysis = DifferentialSymbolicAnalyzer.analyzeDifference(originalSource, mutatedSource, candidate);

        const bindings = diffAnalysis.differentiatingInput?.bindings || { x: 5 };

        return new TestCase({
            input: new TestInput({ bindings }),
            targetKind: 'MUTATION_KILL',
            symbolicPathId: `mut_path_${candidate.mutantId}`,
            metadata: {
                targetMutantId: candidate.mutantId,
                operatorId: candidate.operatorId,
            },
        });
    }
}
