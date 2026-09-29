/**
 * AffectedFunction — Description of an affected function and its impact pathway.
 */

export class AffectedFunction {
    /**
     * @param {object} params
     * @param {string} params.functionName
     * @param {number} [params.depth=0]
     * @param {Array<string>} [params.path=[]]
     * @param {Array<string>} [params.reasons=[]]
     * @param {string} [params.confidence='HIGH_CONFIDENCE']
     * @param {object} [params.metadata={}]
     */
    constructor({
        functionName,
        depth = 0,
        path = [],
        reasons = [],
        confidence = 'HIGH_CONFIDENCE',
        metadata = {},
    } = {}) {
        this.functionName = String(functionName || '');
        this.depth = depth;
        this.path = Object.freeze([...path]);
        this.reasons = Object.freeze([...reasons]);
        this.confidence = confidence;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            functionName: this.functionName,
            depth: this.depth,
            path: this.path,
            reasons: this.reasons,
            confidence: this.confidence,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new AffectedFunction(json);
    }
}
