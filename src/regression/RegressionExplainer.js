/**
 * RegressionExplainer — Builds deterministic, evidence-backed causal explanation chains for regression findings.
 */

export class RegressionExplainer {
    /**
     * Generate structured explanation for a RegressionFinding.
     *
     * @param {import('./RegressionFinding.js').RegressionFinding} finding
     * @returns {object} { target, summary, causalChain, evidence }
     */
    static explain(finding) {
        if (!finding) return null;

        const delta = finding.behavioralDelta || {};
        const isError = Boolean(delta.changed?.exception);
        const changedEntities = finding.changedEntities || [];
        const impactedEntities = finding.impactedEntities || [];

        const causalChain = [];

        // 1. Observed behavioral delta
        if (isError) {
            causalChain.push({
                step: 1,
                kind: 'OBSERVATION',
                description: `Test '${finding.testId}' encountered unexpected ${delta.changed.exception.type || 'error'}`,
            });
        } else if (delta.returnChanged) {
            causalChain.push({
                step: 1,
                kind: 'OBSERVATION',
                description: `Test '${finding.testId}' return value shifted from ${JSON.stringify(delta.baseline?.return)} to ${JSON.stringify(delta.changed?.return)}`,
            });
        } else {
            causalChain.push({
                step: 1,
                kind: 'OBSERVATION',
                description: `Test '${finding.testId}' executed with status: ${finding.classification}`,
            });
        }

        // 2. Affected function / call path
        if (impactedEntities.length > 0) {
            causalChain.push({
                step: 2,
                kind: 'PROPAGATION',
                description: `Impact propagated through downstream entities: ${impactedEntities.join(', ')}`,
            });
        }

        // 3. Changed definition / statement
        if (changedEntities.length > 0) {
            causalChain.push({
                step: 3,
                kind: 'SOURCE_CHANGE',
                description: `Root semantic change in modified entities: ${changedEntities.join(', ')}`,
            });
        }

        const summary = `Regression Finding [${finding.classification}] for test '${finding.testId}': ${causalChain.map(c => c.description).join(' ← ')}`;

        return {
            target: finding.testId,
            classification: finding.classification,
            summary,
            causalChain,
            evidence: finding.evidence || [],
        };
    }
}
