/**
 * MutationConcolicEngine — Concolic feedback loop targeting and killing surviving mutants.
 */

import { MutationTestGenerator } from './MutationTestGenerator.js';
import { DifferentialExecutor } from './DifferentialExecutor.js';
import { MUTATION_STATUS } from './MutationStatus.js';

export class MutationConcolicEngine {
    /**
     * @param {object} [options]
     */
    constructor(options = {}) {
        this.diffExecutor = new DifferentialExecutor(options);
    }

    /**
     * Attempt to kill a surviving mutant via concolic test generation.
     *
     * @param {import('./MutationCandidate.js').MutationCandidate} candidate
     * @param {string} originalSource
     * @returns {{ killed: boolean, generatedTest: import('../testing/TestCase.js').TestCase, result: object }}
     */
    targetMutant(candidate, originalSource) {
        const mutatedSource = candidate.patch.apply(originalSource);
        const generatedTest = MutationTestGenerator.generateTestForMutant(candidate, originalSource);

        const diffRes = this.diffExecutor.executePair(generatedTest, originalSource, mutatedSource);

        const killed = diffRes.killed;
        const updatedCandidate = candidate.withStatus(killed ? MUTATION_STATUS.KILLED : MUTATION_STATUS.SURVIVED);

        return {
            killed,
            candidate: updatedCandidate,
            generatedTest,
            result: diffRes,
        };
    }
}
