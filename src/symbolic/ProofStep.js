/**
 * ProofStep — Individual deductive step in a symbolic proof derivation.
 */

import { PROOF_KINDS } from './ProofKind.js';

export class ProofStep {
    /**
     * @param {object} params
     * @param {string} [params.kind] - PROOF_KINDS member
     * @param {string} params.statement
     * @param {string} [params.justification]
     * @param {object|null} [params.sourceLocation]
     * @param {Array<string>} [params.premises]
     */
    constructor({
        kind = PROOF_KINDS.DERIVED,
        statement,
        justification = '',
        sourceLocation = null,
        premises = [],
    }) {
        this.kind = kind;
        this.statement = String(statement || '');
        this.justification = String(justification || '');
        this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
        this.premises = Object.freeze([...premises]);
        Object.freeze(this);
    }

    toString() {
        return this.justification ? `${this.statement} (by ${this.justification})` : this.statement;
    }

    toJSON() {
        return {
            kind: this.kind,
            statement: this.statement,
            justification: this.justification,
            sourceLocation: this.sourceLocation,
            premises: this.premises,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ProofStep(json);
    }
}
