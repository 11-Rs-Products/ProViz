/**
 * AffectedObject — Description of an affected runtime heap object or instance.
 */

export class AffectedObject {
    /**
     * @param {object} params
     * @param {string} params.objectId
     * @param {Array<string>} [params.reasons=[]]
     * @param {string} [params.confidence='HIGH_CONFIDENCE']
     * @param {object} [params.metadata={}]
     */
    constructor({
        objectId,
        reasons = [],
        confidence = 'HIGH_CONFIDENCE',
        metadata = {},
    } = {}) {
        this.objectId = String(objectId || '');
        this.reasons = Object.freeze([...reasons]);
        this.confidence = confidence;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            objectId: this.objectId,
            reasons: this.reasons,
            confidence: this.confidence,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new AffectedObject(json);
    }
}
