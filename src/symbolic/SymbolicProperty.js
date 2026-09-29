/**
 * SymbolicProperty — Verifiable property paired with symbolic proof and counterexample evidence.
 */

import { Proof } from './Proof.js';
import { Counterexample } from './Counterexample.js';

export class SymbolicProperty {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.name
     * @param {string} [params.status='UNKNOWN'] - 'PROVEN' | 'DISPROVEN' | 'POSSIBLE' | 'UNKNOWN'
     * @param {Proof|null} [params.proof]
     * @param {Counterexample|null} [params.counterexample]
     * @param {Array<string>} [params.conditions]
     */
    constructor({
        id = null,
        name,
        status = 'UNKNOWN',
        proof = null,
        counterexample = null,
        conditions = [],
    }) {
        this.name = String(name || '');
        this.status = status;
        this.proof = proof instanceof Proof ? proof : (proof ? Proof.fromJSON(proof) : null);
        this.counterexample = counterexample instanceof Counterexample ? counterexample : (counterexample ? Counterexample.fromJSON(counterexample) : null);
        this.conditions = Object.freeze([...conditions]);

        this.id = id || `symprop_${SymbolicProperty.computeHash(this.name)}`;
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
            name: this.name,
            status: this.status,
            proof: this.proof ? this.proof.toJSON() : null,
            counterexample: this.counterexample ? this.counterexample.toJSON() : null,
            conditions: this.conditions,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new SymbolicProperty(json);
    }
}
