/**
 * CounterexampleStep — Trace step along an abstract counterexample execution.
 */

export class CounterexampleStep {
    /**
     * @param {object} params
     * @param {string} params.nodeId
     * @param {string} [params.description]
     * @param {object|null} [params.sourceLocation]
     * @param {object} [params.stateValues]
     */
    constructor({
        nodeId,
        description = '',
        sourceLocation = null,
        stateValues = {},
    }) {
        this.nodeId = String(nodeId);
        this.description = String(description);
        this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
        this.stateValues = Object.freeze({ ...stateValues });
        Object.freeze(this);
    }

    toJSON() {
        return {
            nodeId: this.nodeId,
            description: this.description,
            sourceLocation: this.sourceLocation,
            stateValues: this.stateValues,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new CounterexampleStep(json);
    }
}
