/**
 * SymbolicSnapshot — Immutable, frozen snapshot of symbolic analysis, paths, proofs, and counterexamples.
 */

import { SymbolicPath } from './SymbolicPath.js';
import { Proof } from './Proof.js';
import { Counterexample } from './Counterexample.js';

export class SymbolicSnapshot {
    /**
     * @param {object} params
     * @param {number} [params.symbolicVersion=1]
     * @param {string} [params.functionId='<module>']
     * @param {Array<SymbolicPath>} [params.paths]
     * @param {Array<Proof>} [params.proofs]
     * @param {Array<Counterexample>} [params.counterexamples]
     * @param {Array<object>} [params.refinedFindings]
     * @param {string} [params.status='SUCCESS']
     * @param {object} [params.metadata]
     */
    constructor({
        symbolicVersion = 1,
        functionId = '<module>',
        paths = [],
        proofs = [],
        counterexamples = [],
        refinedFindings = [],
        status = 'SUCCESS',
        metadata = {},
    } = {}) {
        this.symbolicVersion = symbolicVersion;
        this.functionId = String(functionId || '<module>');
        this.paths = Object.freeze(paths.map(p => (p instanceof SymbolicPath ? p : SymbolicPath.fromJSON(p))));
        this.proofs = Object.freeze(proofs.map(p => (p instanceof Proof ? p : Proof.fromJSON(p))));
        this.counterexamples = Object.freeze(counterexamples.map(c => (c instanceof Counterexample ? c : Counterexample.fromJSON(c))));
        this.refinedFindings = Object.freeze([...refinedFindings]);
        this.status = status;
        this.metadata = Object.freeze({ ...metadata });

        Object.freeze(this);
    }

    equals(other) {
        if (!other || !(other instanceof SymbolicSnapshot)) return false;
        return (
            this.symbolicVersion === other.symbolicVersion &&
            this.functionId === other.functionId &&
            this.status === other.status &&
            this.paths.length === other.paths.length &&
            this.proofs.length === other.proofs.length
        );
    }

    toJSON() {
        return {
            symbolicVersion: this.symbolicVersion,
            functionId: this.functionId,
            paths: this.paths.map(p => p.toJSON()),
            proofs: this.proofs.map(p => p.toJSON()),
            counterexamples: this.counterexamples.map(c => c.toJSON()),
            refinedFindings: this.refinedFindings,
            status: this.status,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new SymbolicSnapshot({
            ...json,
            paths: (json.paths || []).map(p => SymbolicPath.fromJSON(p)),
            proofs: (json.proofs || []).map(p => Proof.fromJSON(p)),
            counterexamples: (json.counterexamples || []).map(c => Counterexample.fromJSON(c)),
        });
    }
}
