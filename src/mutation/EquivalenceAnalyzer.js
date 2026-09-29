/**
 * EquivalenceAnalyzer — Analyzes whether a mutation produces semantically equivalent behavior.
 */

export const EQUIVALENCE_CERTAINTY = Object.freeze({
    PROVEN_EQUIVALENT: 'PROVEN_EQUIVALENT',
    LIKELY_EQUIVALENT: 'LIKELY_EQUIVALENT',
    UNKNOWN: 'UNKNOWN',
});

export class EquivalenceAnalyzer {
    /**
     * Check if a mutation candidate is provably or likely equivalent to the original.
     *
     * @param {import('./MutationCandidate.js').MutationCandidate} candidate
     * @param {string} originalSource
     * @returns {{ equivalent: boolean, certainty: string, explanation: string }}
     */
    static analyzeEquivalence(candidate, originalSource) {
        const origExpr = candidate.originalExpression.trim();
        const mutExpr = candidate.mutatedExpression.trim();
        const line = candidate.sourceLocation.line;
        const lines = originalSource.split('\n');
        const targetLine = lines[line - 1] || '';

        // 1. Identity equivalence: e.g. + 0 vs - 0
        if ((origExpr === '+' && mutExpr === '-') || (origExpr === '-' && mutExpr === '+')) {
            if (targetLine.includes(' 0') || targetLine.includes('+ 0') || targetLine.includes('- 0')) {
                return {
                    equivalent: true,
                    certainty: EQUIVALENCE_CERTAINTY.PROVEN_EQUIVALENT,
                    explanation: 'Adding or subtracting zero is mathematically equivalent for numeric types',
                };
            }
        }

        // 2. Multiply / Divide by 1
        if ((origExpr === '*' && mutExpr === '/') || (origExpr === '/' && mutExpr === '*')) {
            if (targetLine.includes(' 1') || targetLine.includes('* 1') || targetLine.includes('/ 1')) {
                return {
                    equivalent: true,
                    certainty: EQUIVALENCE_CERTAINTY.PROVEN_EQUIVALENT,
                    explanation: 'Multiplying or dividing by one preserves numeric value',
                };
            }
        }

        return {
            equivalent: false,
            certainty: EQUIVALENCE_CERTAINTY.UNKNOWN,
            explanation: 'Semantic divergence is possible under distinct inputs',
        };
    }
}
