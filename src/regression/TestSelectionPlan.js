/**
 * TestSelectionPlan — Complete deterministic execution plan for regression testing.
 */

import { TestRelevance } from './TestRelevance.js';

export class TestSelectionPlan {
    /**
     * @param {object} params
     * @param {string} [params.planId=null]
     * @param {string} [params.strategy='HYBRID']
     * @param {Array<TestRelevance|object>} [params.selectedTests=[]]
     * @param {Array<string>} [params.deselectedTests=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        planId = null,
        strategy = 'HYBRID',
        selectedTests = [],
        deselectedTests = [],
        metadata = {},
    } = {}) {
        this.strategy = strategy;
        this.selectedTests = Object.freeze(selectedTests.map(t => t instanceof TestRelevance ? t : new TestRelevance(t)));
        this.deselectedTests = Object.freeze([...deselectedTests].sort());
        this.metadata = Object.freeze({ ...metadata });

        const hashInput = JSON.stringify({
            strat: this.strategy,
            sel: this.selectedTests.map(t => ({ id: t.testId, prio: t.priority })),
            desel: this.deselectedTests,
        });

        this.planId = planId || `plan_${TestSelectionPlan.computeHash(hashInput)}`;
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

    get selectedCount() {
        return this.selectedTests.length;
    }

    get deselectedCount() {
        return this.deselectedTests.length;
    }

    get totalCount() {
        return this.selectedCount + this.deselectedCount;
    }

    getSelectedTestIds() {
        return this.selectedTests.map(t => t.testId);
    }

    getRelevance(testId) {
        return this.selectedTests.find(t => t.testId === String(testId)) || null;
    }

    toJSON() {
        return {
            planId: this.planId,
            strategy: this.strategy,
            selectedTests: this.selectedTests.map(t => t.toJSON()),
            deselectedTests: [...this.deselectedTests],
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TestSelectionPlan({
            planId: json.planId,
            strategy: json.strategy,
            selectedTests: (json.selectedTests || []).map(t => TestRelevance.fromJSON(t)),
            deselectedTests: json.deselectedTests || [],
            metadata: json.metadata,
        });
    }
}
