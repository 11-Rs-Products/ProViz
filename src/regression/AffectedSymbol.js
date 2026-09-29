/**
 * AffectedSymbol — Description of an affected symbol and its causal impact trail.
 */

export class AffectedSymbol {
    /**
     * @param {object} params
     * @param {string} params.symbolName
     * @param {number} [params.depth=0]
     * @param {Array<string>} [params.path=[]]
     * @param {Array<string>} [params.reasons=[]]
     * @param {string} [params.confidence='HIGH_CONFIDENCE']
     * @param {object} [params.metadata={}]
     */
    constructor({
        symbolName,
        depth = 0,
        path = [],
        reasons = [],
        confidence = 'HIGH_CONFIDENCE',
        metadata = {},
    } = {}) {
        this.symbolName = String(symbolName || '');
        this.depth = depth;
        this.path = Object.freeze([...path]);
        this.reasons = Object.freeze([...reasons]);
        this.confidence = confidence;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            symbolName: this.symbolName,
            depth: this.depth,
            path: this.path,
            reasons: this.reasons,
            confidence: this.confidence,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new AffectedSymbol(json);
    }
}
