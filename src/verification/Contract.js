/**
 * Contract — Function precondition, postcondition, and invariant specification.
 */

export class Contract {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.functionId
     * @param {Array<string>} [params.preconditions] - List of precondition expressions
     * @param {Array<string>} [params.postconditions] - List of postcondition expressions
     * @param {Array<string>} [params.invariants]
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        functionId,
        preconditions = [],
        postconditions = [],
        invariants = [],
        metadata = {},
    }) {
        this.functionId = String(functionId || '<module>');
        this.preconditions = Object.freeze([...preconditions]);
        this.postconditions = Object.freeze([...postconditions]);
        this.invariants = Object.freeze([...invariants]);
        this.metadata = Object.freeze({ ...metadata });

        this.id = id || `contract_${this.functionId}`;
        Object.freeze(this);
    }

    toJSON() {
        return {
            id: this.id,
            functionId: this.functionId,
            preconditions: this.preconditions,
            postconditions: this.postconditions,
            invariants: this.invariants,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Contract(json);
    }
}
