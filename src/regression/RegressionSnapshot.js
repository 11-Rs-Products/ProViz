/**
 * RegressionSnapshot — Immutable point-in-time snapshot of the complete regression intelligence state.
 */

import { RegressionCampaign } from './RegressionCampaign.js';
import { SemanticChangeSet } from './SemanticChangeSet.js';
import { ImpactGraph } from './ImpactGraph.js';
import { TestSelectionPlan } from './TestSelectionPlan.js';
import { RiskScore } from './RiskScore.js';

export class RegressionSnapshot {
    /**
     * @param {object} params
     * @param {string} [params.snapshotId=null]
     * @param {number} [params.workspaceVersion=1]
     * @param {RegressionCampaign|object|null} [params.campaign=null]
     * @param {SemanticChangeSet|object|null} [params.changeSet=null]
     * @param {ImpactGraph|object|null} [params.impactGraph=null]
     * @param {TestSelectionPlan|object|null} [params.selectionPlan=null]
     * @param {RiskScore|object|null} [params.riskScore=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        snapshotId = null,
        workspaceVersion = 1,
        campaign = null,
        changeSet = null,
        impactGraph = null,
        selectionPlan = null,
        riskScore = null,
        metadata = {},
    } = {}) {
        this.workspaceVersion = Number(workspaceVersion) || 1;
        this.campaign = campaign instanceof RegressionCampaign ? campaign : (campaign ? RegressionCampaign.fromJSON(campaign) : null);
        this.changeSet = changeSet instanceof SemanticChangeSet ? changeSet : (changeSet ? SemanticChangeSet.fromJSON(changeSet) : this.campaign?.changeSet || new SemanticChangeSet());
        this.impactGraph = impactGraph instanceof ImpactGraph ? impactGraph : (impactGraph ? ImpactGraph.fromJSON(impactGraph) : this.campaign?.impactGraph || new ImpactGraph());
        this.selectionPlan = selectionPlan instanceof TestSelectionPlan ? selectionPlan : (selectionPlan ? TestSelectionPlan.fromJSON(selectionPlan) : this.campaign?.selectionPlan || new TestSelectionPlan());
        this.riskScore = riskScore instanceof RiskScore ? riskScore : (riskScore ? RiskScore.fromJSON(riskScore) : this.campaign?.riskScore || new RiskScore());
        this.metadata = Object.freeze({ ...metadata });

        const hashInput = JSON.stringify({
            ver: this.workspaceVersion,
            camp: this.campaign?.campaignId,
            changes: this.changeSet.size,
            risk: this.riskScore.total,
        });

        this.snapshotId = snapshotId || `reg_snap_${RegressionSnapshot.computeHash(hashInput)}`;
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

    toJSON() {
        return {
            snapshotId: this.snapshotId,
            workspaceVersion: this.workspaceVersion,
            campaign: this.campaign ? this.campaign.toJSON() : null,
            changeSet: this.changeSet.toJSON(),
            impactGraph: this.impactGraph.toJSON(),
            selectionPlan: this.selectionPlan.toJSON(),
            riskScore: this.riskScore.toJSON(),
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RegressionSnapshot({
            snapshotId: json.snapshotId,
            workspaceVersion: json.workspaceVersion,
            campaign: json.campaign ? RegressionCampaign.fromJSON(json.campaign) : null,
            changeSet: SemanticChangeSet.fromJSON(json.changeSet),
            impactGraph: ImpactGraph.fromJSON(json.impactGraph),
            selectionPlan: TestSelectionPlan.fromJSON(json.selectionPlan),
            riskScore: RiskScore.fromJSON(json.riskScore),
            metadata: json.metadata,
        });
    }
}
