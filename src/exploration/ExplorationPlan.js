/**
 * ExplorationPlan — Deterministic specification of generators, budgets, and exploration strategy.
 */

import { ExplorationBudget } from './ExplorationBudget.js';

export class ExplorationPlan {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} [params.strategy='HYBRID']
     * @param {ExplorationBudget|object} [params.budget]
     * @param {number} [params.seed=42]
     * @param {Array<string>} [params.targetFunctions=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        strategy = 'HYBRID',
        budget = new ExplorationBudget(),
        seed = 42,
        targetFunctions = [],
        metadata = {},
    } = {}) {
        this.strategy = String(strategy);
        this.budget = budget instanceof ExplorationBudget ? budget : ExplorationBudget.fromJSON(budget);
        this.seed = Number(seed);
        this.targetFunctions = Object.freeze([...targetFunctions]);
        this.metadata = Object.freeze({ ...metadata });

        const hashPayload = JSON.stringify({
            strategy: this.strategy,
            seed: this.seed,
            targets: this.targetFunctions,
        });
        this.id = id || `plan_exp_${ExplorationPlan.computeHash(hashPayload)}`;
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
            strategy: this.strategy,
            budget: this.budget.toJSON(),
            seed: this.seed,
            targetFunctions: this.targetFunctions,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ExplorationPlan(json);
    }
}
