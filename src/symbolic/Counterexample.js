/**
 * Counterexample — Abstract or observed counterexample refuting a safety property.
 */

import { CounterexampleStep } from './CounterexampleStep.js';

export class Counterexample {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.property - Property being refuted
     * @param {object} [params.assignments] - Variable assignments demonstrating the issue
     * @param {Array<CounterexampleStep>} [params.steps]
     * @param {string} [params.status='SYMBOLIC_COUNTEREXAMPLE'] - 'SYMBOLIC_COUNTEREXAMPLE' | 'DYNAMICALLY_OBSERVED'
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        property,
        assignments = {},
        steps = [],
        status = 'SYMBOLIC_COUNTEREXAMPLE',
        metadata = {},
    }) {
        this.property = String(property || '');
        this.assignments = Object.freeze({ ...assignments });
        this.steps = Object.freeze(steps.map(s => (s instanceof CounterexampleStep ? s : CounterexampleStep.fromJSON(s))));
        this.status = status;
        this.metadata = Object.freeze({ ...metadata });

        const seed = `${this.property}:${JSON.stringify(this.assignments)}`;
        this.id = id || `cex_${Counterexample.computeHash(seed)}`;
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
            property: this.property,
            assignments: this.assignments,
            steps: this.steps.map(s => s.toJSON()),
            status: this.status,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Counterexample({
            ...json,
            steps: (json.steps || []).map(s => CounterexampleStep.fromJSON(s)),
        });
    }
}
