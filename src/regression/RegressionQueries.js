/**
 * RegressionQueries — High-level query interface over an immutable RegressionSnapshot.
 */

import { RegressionSnapshot } from './RegressionSnapshot.js';
import { MutationImpactAnalyzer } from './MutationImpactAnalyzer.js';
import { RepairImpactAnalyzer } from './RepairImpactAnalyzer.js';

export class RegressionQueries {
    /**
     * @param {RegressionSnapshot|object} snapshot
     * @param {object} [context={}]
     */
    constructor(snapshot, context = {}) {
        this._snapshot = snapshot instanceof RegressionSnapshot ? snapshot : RegressionSnapshot.fromJSON(snapshot);
        this._context = context;
    }

    getSemanticDiff() {
        return this._context.semanticDiff || null;
    }

    getChanges() {
        return this._snapshot.changeSet ? this._snapshot.changeSet.changes : [];
    }

    getChange(changeId) {
        return this._snapshot.changeSet ? this._snapshot.changeSet.get(changeId) : null;
    }

    getImpactGraph() {
        return this._snapshot.impactGraph;
    }

    getAffectedSymbols() {
        return this._context.impactResults?.affectedSymbols || [];
    }

    getAffectedFunctions() {
        return this._context.impactResults?.affectedFunctions || [];
    }

    getAffectedModules() {
        return this._context.impactResults?.affectedModules || [];
    }

    getAffectedPaths() {
        return this._context.impactResults?.affectedPaths || [];
    }

    getAffectedProperties() {
        return this._context.impactResults?.affectedProperties || [];
    }

    getAffectedTests() {
        return this._context.impactResults?.affectedTests || [];
    }

    getTestRelevance(testId) {
        return this._snapshot.selectionPlan ? this._snapshot.selectionPlan.getRelevance(testId) : null;
    }

    getTestSelectionPlan() {
        return this._snapshot.selectionPlan;
    }

    getChangeCoverage() {
        return this._snapshot.campaign ? this._snapshot.campaign.changeCoverage : null;
    }

    getRegressionFindings() {
        return this._snapshot.campaign ? this._snapshot.campaign.findings : [];
    }

    getRegressionFinding(id) {
        const findings = this.getRegressionFindings();
        return findings.find(f => f.id === id) || null;
    }

    getRiskScore() {
        return this._snapshot.riskScore;
    }

    getConfidenceScore() {
        const changes = this.getChanges();
        const hasProven = changes.some(c => c.confidence === 'PROVEN');
        return {
            level: hasProven ? 'PROVEN' : 'HIGH_CONFIDENCE',
            value: hasProven ? 1.0 : 0.85,
        };
    }

    explainImpact(targetId) {
        if (this._context.impactResults?.explainImpact) {
            return this._context.impactResults.explainImpact(targetId);
        }
        return {
            targetId,
            explanation: `Entity '${targetId}' impacted by change propagation`,
        };
    }

    explainRegression(findingId) {
        const finding = this.getRegressionFinding(findingId);
        if (!finding) return null;
        return {
            findingId,
            explanation: finding.explanation,
            classification: finding.classification,
        };
    }

    getMutationImpact(changeId) {
        const code = this._context.sourceCode || '';
        return MutationImpactAnalyzer.analyze(code, this._snapshot.changeSet);
    }

    getRepairImpact(patchSetId) {
        if (this._context.beforeSnapshot && this._context.afterSnapshot) {
            return RepairImpactAnalyzer.analyzeRepairImpact(
                { id: patchSetId },
                this._context.beforeSnapshot,
                this._context.afterSnapshot
            );
        }
        return null;
    }

    getRegressionSnapshot() {
        return this._snapshot;
    }
}
