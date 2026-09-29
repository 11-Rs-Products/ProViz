/**
 * RegressionCampaign — Comprehensive lifecycle container for a regression analysis and test execution run.
 */

import { SemanticChangeSet } from './SemanticChangeSet.js';
import { ImpactGraph } from './ImpactGraph.js';
import { TestSelectionPlan } from './TestSelectionPlan.js';
import { RegressionResult } from './RegressionResult.js';
import { RegressionFinding } from './RegressionFinding.js';
import { ChangeCoverage } from './ChangeCoverage.js';
import { RiskScore } from './RiskScore.js';

export const REGRESSION_CAMPAIGN_STATUSES = Object.freeze({
    CREATED: 'CREATED',
    ANALYZING: 'ANALYZING',
    IMPACT_ANALYZED: 'IMPACT_ANALYZED',
    TESTS_SELECTED: 'TESTS_SELECTED',
    EXECUTING: 'EXECUTING',
    COMPARING: 'COMPARING',
    CLASSIFYING: 'CLASSIFYING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
});

export class RegressionCampaign {
    /**
     * @param {object} params
     * @param {string} [params.campaignId=null]
     * @param {string} [params.status=REGRESSION_CAMPAIGN_STATUSES.CREATED]
     * @param {object|null} [params.beforeSnapshot=null]
     * @param {object|null} [params.afterSnapshot=null]
     * @param {SemanticChangeSet|object|null} [params.changeSet=null]
     * @param {ImpactGraph|object|null} [params.impactGraph=null]
     * @param {TestSelectionPlan|object|null} [params.selectionPlan=null]
     * @param {Array<RegressionResult|object>} [params.results=[]]
     * @param {Array<RegressionFinding|object>} [params.findings=[]]
     * @param {ChangeCoverage|object|null} [params.changeCoverage=null]
     * @param {RiskScore|object|null} [params.riskScore=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        campaignId = null,
        status = REGRESSION_CAMPAIGN_STATUSES.CREATED,
        beforeSnapshot = null,
        afterSnapshot = null,
        changeSet = null,
        impactGraph = null,
        selectionPlan = null,
        results = [],
        findings = [],
        changeCoverage = null,
        riskScore = null,
        metadata = {},
    } = {}) {
        this.status = status;
        this.beforeSnapshot = beforeSnapshot;
        this.afterSnapshot = afterSnapshot;
        this.changeSet = changeSet instanceof SemanticChangeSet ? changeSet : (changeSet ? SemanticChangeSet.fromJSON(changeSet) : new SemanticChangeSet());
        this.impactGraph = impactGraph instanceof ImpactGraph ? impactGraph : (impactGraph ? ImpactGraph.fromJSON(impactGraph) : new ImpactGraph());
        this.selectionPlan = selectionPlan instanceof TestSelectionPlan ? selectionPlan : (selectionPlan ? TestSelectionPlan.fromJSON(selectionPlan) : new TestSelectionPlan());
        this.results = Object.freeze(results.map(r => r instanceof RegressionResult ? r : RegressionResult.fromJSON(r)));
        this.findings = Object.freeze(findings.map(f => f instanceof RegressionFinding ? f : RegressionFinding.fromJSON(f)));
        this.changeCoverage = changeCoverage instanceof ChangeCoverage ? changeCoverage : (changeCoverage ? ChangeCoverage.fromJSON(changeCoverage) : new ChangeCoverage());
        this.riskScore = riskScore instanceof RiskScore ? riskScore : (riskScore ? RiskScore.fromJSON(riskScore) : new RiskScore());
        this.metadata = Object.freeze({ ...metadata });

        const hashInput = JSON.stringify({
            changes: this.changeSet.size,
            selected: this.selectionPlan.selectedCount,
            results: this.results.length,
            findings: this.findings.length,
        });

        this.campaignId = campaignId || `campaign_${RegressionCampaign.computeHash(hashInput)}`;
        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    get hasRegressions() {
        return this.findings.some(f => f.classification === 'UNEXPECTED_REGRESSION' || f.classification === 'RETURN_VALUE_CHANGED');
    }

    toJSON() {
        return {
            campaignId: this.campaignId,
            status: this.status,
            changeSet: this.changeSet.toJSON(),
            impactGraph: this.impactGraph.toJSON(),
            selectionPlan: this.selectionPlan.toJSON(),
            results: this.results.map(r => r.toJSON()),
            findings: this.findings.map(f => f.toJSON()),
            changeCoverage: this.changeCoverage.toJSON(),
            riskScore: this.riskScore.toJSON(),
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RegressionCampaign({
            campaignId: json.campaignId,
            status: json.status,
            changeSet: SemanticChangeSet.fromJSON(json.changeSet),
            impactGraph: ImpactGraph.fromJSON(json.impactGraph),
            selectionPlan: TestSelectionPlan.fromJSON(json.selectionPlan),
            results: (json.results || []).map(r => RegressionResult.fromJSON(r)),
            findings: (json.findings || []).map(f => RegressionFinding.fromJSON(f)),
            changeCoverage: ChangeCoverage.fromJSON(json.changeCoverage),
            riskScore: RiskScore.fromJSON(json.riskScore),
            metadata: json.metadata,
        });
    }
}
