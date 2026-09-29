/**
 * Proof — Structured derivation proving or disproving a program property under symbolic assumptions.
 */

import { ProofStep } from './ProofStep.js';

export class Proof {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.property - Description of target property
     * @param {string} [params.status='PROVEN'] - 'PROVEN' | 'DISPROVEN' | 'UNKNOWN'
     * @param {Array<ProofStep>} [params.steps]
     * @param {Array<string>} [params.assumptions]
     * @param {string} [params.confidence='SYMBOLIC_PROOF']
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        property,
        status = 'PROVEN',
        steps = [],
        assumptions = [],
        confidence = 'SYMBOLIC_PROOF',
        metadata = {},
    }) {
        this.property = String(property || '');
        this.status = status;
        this.steps = Object.freeze(steps.map(s => (s instanceof ProofStep ? s : ProofStep.fromJSON(s))));
        this.assumptions = Object.freeze([...assumptions]);
        this.confidence = confidence;
        this.metadata = Object.freeze({ ...metadata });

        const seed = `${this.property}:${this.status}:${this.steps.length}`;
        this.id = id || `proof_${Proof.computeHash(seed)}`;
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

    isProven() { return this.status === 'PROVEN'; }
    isDisproven() { return this.status === 'DISPROVEN'; }

    toJSON() {
        return {
            id: this.id,
            property: this.property,
            status: this.status,
            steps: this.steps.map(s => s.toJSON()),
            assumptions: this.assumptions,
            confidence: this.confidence,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Proof({
            ...json,
            steps: (json.steps || []).map(s => ProofStep.fromJSON(s)),
        });
    }
}
