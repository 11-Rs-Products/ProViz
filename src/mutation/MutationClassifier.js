/**
 * MutationClassifier — Classifies mutation candidates into KILLED, SURVIVED, EQUIVALENT, or UNKNOWN.
 */

import { MUTATION_STATUS } from './MutationStatus.js';
import { EquivalenceAnalyzer, EQUIVALENCE_CERTAINTY } from './EquivalenceAnalyzer.js';

export class MutationClassifier {
    /**
     * Classify a mutation candidate given test execution results and source code.
     *
     * @param {import('./MutationCandidate.js').MutationCandidate} candidate
     * @param {object} execResult - Result from MutationExecutor
     * @param {string} originalSource
     * @returns {{ status: string, classification: string, explanation: string }}
     */
    static classify(candidate, execResult, originalSource) {
        // 1. If killed by tests, status is KILLED
        if (execResult?.killed) {
            return {
                status: MUTATION_STATUS.KILLED,
                classification: 'KILLED',
                explanation: `Mutant detected and killed by ${execResult.killingTests?.length || 1} test(s)`,
            };
        }

        // 2. Check for proven equivalence
        const eqAnalysis = EquivalenceAnalyzer.analyzeEquivalence(candidate, originalSource);
        if (eqAnalysis.equivalent && eqAnalysis.certainty === EQUIVALENCE_CERTAINTY.PROVEN_EQUIVALENT) {
            return {
                status: MUTATION_STATUS.EQUIVALENT,
                classification: 'EQUIVALENT',
                explanation: eqAnalysis.explanation,
            };
        }

        // 3. Otherwise, the mutant survived the test campaign
        return {
            status: MUTATION_STATUS.SURVIVED,
            classification: 'SURVIVED',
            explanation: 'Mutant survived existing test suite and oracles without detection',
        };
    }
}
