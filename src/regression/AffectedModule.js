/**
 * AffectedModule — Description of an affected module in multi-file workspaces.
 */

export class AffectedModule {
    /**
     * @param {object} params
     * @param {string} params.moduleId
     * @param {number} [params.depth=0]
     * @param {Array<string>} [params.path=[]]
     * @param {Array<string>} [params.reasons=[]]
     * @param {string} [params.confidence='HIGH_CONFIDENCE']
     * @param {object} [params.metadata={}]
     */
    constructor({
        moduleId,
        depth = 0,
        path = [],
        reasons = [],
        confidence = 'HIGH_CONFIDENCE',
        metadata = {},
    } = {}) {
        this.moduleId = String(moduleId || '');
        this.depth = depth;
        this.path = Object.freeze([...path]);
        this.reasons = Object.freeze([...reasons]);
        this.confidence = confidence;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            moduleId: this.moduleId,
            depth: this.depth,
            path: this.path,
            reasons: this.reasons,
            confidence: this.confidence,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new AffectedModule(json);
    }
}
