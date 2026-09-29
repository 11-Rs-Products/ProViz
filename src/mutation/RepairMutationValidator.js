/**
 * RepairMutationValidator — Validates that test suites surrounding a Stage 19 repair detect perturbations.
 */

import { MutationGenerator } from './MutationGenerator.js';
import { MutationExecutor } from './MutationExecutor.js';
import { MutationScore } from './MutationScore.js';

export class RepairMutationValidator {
    /**
     * Test a repair candidate against mutations.
     *
     * @param {import('../repair/RepairCandidate.js').RepairCandidate} repairCandidate
     * @param {string} originalSource
     * @param {Array<import('../testing/TestCase.js').TestCase>} [testSuite=[]]
     * @returns {{ valid: boolean, score: MutationScore, mutantsEvaluated: number, results: Array<object> }}
     */
    static validateRepairRobustness(repairCandidate, originalSource, testSuite = []) {
        const repairedSource = repairCandidate.patch.apply(originalSource);
        const mutants = MutationGenerator.generateMutations(repairedSource);

        const executor = new MutationExecutor();
        const results = [];

        for (const mut of mutants) {
            const execRes = executor.executeMutant(mut, repairedSource, testSuite);
            results.push({
                mutantId: mut.mutantId,
                status: execRes.killed ? 'KILLED' : 'SURVIVED',
                execRes,
            });
        }

        const score = MutationScore.compute(results);

        return {
            valid: score.killed > 0 || mutants.length === 0,
            score,
            mutantsEvaluated: mutants.length,
            results,
        };
    }
}
