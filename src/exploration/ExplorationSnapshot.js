/**
 * ExplorationSnapshot — Immutable, frozen persistence snapshot of an exploration campaign.
 */

import { ExplorationPlan } from './ExplorationPlan.js';
import { ExplorationResult } from './ExplorationResult.js';

export class ExplorationSnapshot {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {ExplorationPlan|object} [params.plan]
     * @param {Array<ExplorationResult>} [params.results=[]]
     * @param {Array<object>} [params.findings=[]]
     * @param {Array<object>} [params.metamorphicRelations=[]]
     * @param {string} [params.status='COMPLETED']
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        plan = new ExplorationPlan(),
        results = [],
        findings = [],
        metamorphicRelations = [],
        status = 'COMPLETED',
        metadata = {},
    } = {}) {
        this.plan = plan instanceof ExplorationPlan ? plan : ExplorationPlan.fromJSON(plan);
        this.results = Object.freeze(results.map(r => r instanceof ExplorationResult ? r : ExplorationResult.fromJSON(r)));
        this.findings = Object.freeze([...findings]);
        this.metamorphicRelations = Object.freeze([...metamorphicRelations]);
        this.status = String(status);
        this.metadata = Object.freeze({ ...metadata });

        const hashPayload = JSON.stringify({
            planId: this.plan.id,
            resultCount: this.results.length,
            findingsCount: this.findings.length,
            status: this.status,
        });
        this.id = id || `exp_snap_${ExplorationSnapshot.computeHash(hashPayload)}`;
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
            id: this.id,
            plan: this.plan.toJSON(),
            results: this.results.map(r => r.toJSON()),
            findings: this.findings,
            metamorphicRelations: this.metamorphicRelations,
            status: this.status,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ExplorationSnapshot({
            id: json.id,
            plan: ExplorationPlan.fromJSON(json.plan),
            results: (json.results || []).map(r => ExplorationResult.fromJSON(r)),
            findings: json.findings || [],
            metamorphicRelations: json.metamorphicRelations || [],
            status: json.status,
            metadata: json.metadata || {},
        });
    }
}
