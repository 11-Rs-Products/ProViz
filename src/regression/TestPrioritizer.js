/**
 * TestPrioritizer — Deterministically orders selected regression tests based on multi-criteria signals.
 */

import { TestRelevance } from './TestRelevance.js';

export class TestPrioritizer {
    /**
     * Prioritize an array of TestRelevance objects or raw test descriptors.
     *
     * @param {Array<TestRelevance|object>} tests
     * @param {object} [weights={}]
     * @returns {Array<TestRelevance>}
     */
    static prioritize(tests, weights = {}) {
        const wDistance = weights.distance ?? 0.35;
        const wDirect = weights.directImpact ?? 0.25;
        const wMutation = weights.mutationKilling ?? 0.2;
        const wConcolic = weights.concolicSignal ?? 0.2;

        const evaluated = tests.map(t => {
            const rel = t instanceof TestRelevance ? t : new TestRelevance(t);
            let score = 0.5;

            // Direct impact bonus
            if (rel.relevance === 'DIRECTLY_AFFECTED') {
                score += wDirect;
            } else if (rel.relevance === 'INDIRECTLY_AFFECTED') {
                score += wDirect * 0.5;
            }

            // Distance penalty / proximity bonus from metadata
            const depth = rel.metadata.depth || 0;
            const distanceBonus = Math.max(0, 1 - (depth * 0.15)) * wDistance;
            score += distanceBonus;

            // Mutation killing bonus if present
            if (rel.reasons.some(r => String(r).includes('mutation') || String(r).includes('mutant'))) {
                score += wMutation;
            }

            // Concolic exploration bonus if present
            if (rel.reasons.some(r => String(r).includes('concolic') || String(r).includes('branch'))) {
                score += wConcolic;
            }

            const finalPriority = Math.max(0, Math.min(1, Math.round(score * 1000) / 1000));

            return new TestRelevance({
                testId: rel.testId,
                relevance: rel.relevance,
                reasons: rel.reasons,
                impactedEntities: rel.impactedEntities,
                confidence: rel.confidence,
                priority: finalPriority,
                metadata: {
                    ...rel.metadata,
                    prioritizationFactors: {
                        distanceBonus,
                        baseRelevance: rel.relevance,
                    },
                },
            });
        });

        // Deterministic sort: higher priority first, break ties with lexical testId
        return evaluated.sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority;
            return a.testId.localeCompare(b.testId);
        });
    }
}
