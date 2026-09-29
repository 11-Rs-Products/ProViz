/**
 * RegressionAnalyzer — Orchestrates observation comparison, finding classification, and explanation generation.
 */

import { RegressionComparator } from './RegressionComparator.js';
import { RegressionFinding } from './RegressionFinding.js';
import { RegressionExplainer } from './RegressionExplainer.js';
import { REGRESSION_CLASSIFICATIONS } from './RegressionClassification.js';

export class RegressionAnalyzer {
    /**
     * @param {object} [options={}]
     */
    constructor(options = {}) {
        this.options = options;
    }

    /**
     * Analyze a single test's baseline vs changed execution.
     *
     * @param {string} testId
     * @param {object} baselineObs
     * @param {object} changedObs
     * @param {object} [context={}] - { expectation, changedEntities, impactedEntities, sourceLocations }
     * @returns {RegressionFinding}
     */
    analyzeFinding(testId, baselineObs, changedObs, context = {}) {
        const { classification, delta, isRegression } = RegressionComparator.compare(
            baselineObs,
            changedObs,
            context.expectation || null
        );

        const finding = new RegressionFinding({
            classification,
            testId,
            sourceLocations: context.sourceLocations || [],
            changedEntities: context.changedEntities || [],
            impactedEntities: context.impactedEntities || [],
            baselineObservation: baselineObs,
            changedObservation: changedObs,
            behavioralDelta: delta,
            expectation: context.expectation || null,
            evidence: context.evidence || [],
            confidence: isRegression ? 'PROVEN' : 'HIGH_CONFIDENCE',
        });

        const explanationObj = RegressionExplainer.explain(finding);

        return new RegressionFinding({
            ...finding.toJSON(),
            explanation: explanationObj.summary,
        });
    }
}
