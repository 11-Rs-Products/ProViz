/**
 * ExplorationSession — Immutable identity and parameters of an active/historical concolic exploration session.
 */

export class ExplorationSession {
    /**
     * @param {object} params
     * @param {string} [params.sessionId]
     * @param {string} [params.strategy='DFS']
     * @param {number} [params.maxPaths=20]
     * @param {number} [params.maxExplorations=50]
     * @param {number} [params.timeoutMs=2000]
     * @param {object} [params.metadata={}]
     */
    constructor({
        sessionId = null,
        strategy = 'DFS',
        maxPaths = 20,
        maxExplorations = 50,
        timeoutMs = 2000,
        metadata = {},
    } = {}) {
        this.strategy = strategy;
        this.maxPaths = maxPaths;
        this.maxExplorations = maxExplorations;
        this.timeoutMs = timeoutMs;
        this.metadata = Object.freeze({ ...metadata });

        const hash = ExplorationSession.computeHash(JSON.stringify({ strategy: this.strategy, maxPaths: this.maxPaths }));
        this.sessionId = sessionId || `session_${hash}`;
        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    toJSON() {
        return {
            sessionId: this.sessionId,
            strategy: this.strategy,
            maxPaths: this.maxPaths,
            maxExplorations: this.maxExplorations,
            timeoutMs: this.timeoutMs,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ExplorationSession(json);
    }
}
