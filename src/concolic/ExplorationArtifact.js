/**
 * ExplorationArtifact — Serializable, exportable artifact recording the entire exploration outcome.
 */

export class ExplorationArtifact {
    /**
     * @param {object} params
     * @param {string} params.language
     * @param {string} params.sessionId
     * @param {object} params.result
     * @param {object} [params.metadata={}]
     */
    constructor({
        language = 'python',
        sessionId,
        result,
        metadata = {},
    } = {}) {
        this.language = language;
        this.sessionId = String(sessionId);
        this.result = result;
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            language: this.language,
            sessionId: this.sessionId,
            result: this.result?.toJSON ? this.result.toJSON() : this.result,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ExplorationArtifact(json);
    }
}
