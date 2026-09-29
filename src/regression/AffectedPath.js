/**
 * AffectedPath — Description of an affected execution or symbolic path.
 */

export class AffectedPath {
    /**
     * @param {object} params
     * @param {string} params.pathId
     * @param {Array<string>} [params.reasons=[]]
     * @param {string} [params.confidence='HIGH_CONFIDENCE']
     * @param {object} [params.metadata={}]
     */
    constructor({
        pathId,
        reasons = [],
        confidence = 'HIGH_CONFIDENCE',
        metadata = {},
    } = {}) {
        this.pathId = String(pathId || '');
        this.reasons = Object.freeze([...reasons]);
        this.confidence = confidence;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            pathId: this.pathId,
            reasons: this.reasons,
            confidence: this.confidence,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new AffectedPath(json);
    }
}
