/**
 * AffectedProperty — Description of an affected verification property or contract.
 */

export class AffectedProperty {
    /**
     * @param {object} params
     * @param {string} params.propertyId
     * @param {string} [params.oldStatus='UNKNOWN']
     * @param {string} [params.newStatus='UNKNOWN']
     * @param {Array<string>} [params.reasons=[]]
     * @param {string} [params.confidence='PROVEN']
     * @param {object} [params.metadata={}]
     */
    constructor({
        propertyId,
        oldStatus = 'UNKNOWN',
        newStatus = 'UNKNOWN',
        reasons = [],
        confidence = 'PROVEN',
        metadata = {},
    } = {}) {
        this.propertyId = String(propertyId || '');
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.reasons = Object.freeze([...reasons]);
        this.confidence = confidence;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            propertyId: this.propertyId,
            oldStatus: this.oldStatus,
            newStatus: this.newStatus,
            reasons: this.reasons,
            confidence: this.confidence,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new AffectedProperty(json);
    }
}
