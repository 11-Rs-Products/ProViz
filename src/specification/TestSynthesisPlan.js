/**
 * TestSynthesisPlan — Deterministic plan mapping objectives to synthesis strategies.
 */

export class TestSynthesisPlan {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {Array<object>} [params.objectives=[]]
     * @param {string} [params.strategy='HYBRID']
     * @param {object} [params.options={}]
     */
    constructor({
        id = null,
        objectives = [],
        strategy = 'HYBRID',
        options = {},
    } = {}) {
        this.objectives = Object.freeze([...objectives]);
        this.strategy = strategy;
        this.options = Object.freeze({ ...options });

        const hashPayload = JSON.stringify({
            strategy: this.strategy,
            objectiveIds: this.objectives.map(o => o.id),
        });

        this.id = id || `plan_synth_${TestSynthesisPlan.computeHash(hashPayload)}`;
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
            objectives: this.objectives,
            strategy: this.strategy,
            options: this.options,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TestSynthesisPlan(json);
    }
}
