/**
 * AliasSet — Tracks all variables and reference pathways pointing to a specific canonical heap object.
 */

export class AliasSet {
    /**
     * @param {object} params
     * @param {string} params.objectId - Canonical Heap Object ID (e.g. 'obj_1')
     * @param {Array} [params.aliases] - Array of alias entries: { name, frameIndex, scopeId, fileId }
     * @param {number} [params.firstSeenFrame] - First frame index where object appeared
     * @param {number} [params.lastSeenFrame] - Last frame index where object was referenced
     * @param {object} [params.metadata]
     */
    constructor({
        objectId,
        aliases = [],
        firstSeenFrame = 0,
        lastSeenFrame = 0,
        metadata = {},
    }) {
        if (!objectId) {
            throw new Error('AliasSet requires a valid objectId');
        }
        this.objectId = objectId;
        this.aliases = Array.isArray(aliases) ? aliases.map(a => ({ ...a })) : [];
        this.firstSeenFrame = typeof firstSeenFrame === 'number' ? firstSeenFrame : 0;
        this.lastSeenFrame = typeof lastSeenFrame === 'number' ? lastSeenFrame : 0;
        this.metadata = { ...metadata };
    }

    /**
     * Adds an alias reference for a variable.
     * @param {string} variableName
     * @param {number} frameIndex
     * @param {string} [scopeId='local']
     * @param {string} [fileId='main.py']
     */
    addAlias(variableName, frameIndex, scopeId = 'local', fileId = 'main.py') {
        if (!variableName) return;
        const existing = this.aliases.find(a => a.name === variableName && a.scopeId === scopeId && a.fileId === fileId);
        if (!existing) {
            this.aliases.push({
                name: variableName,
                frameIndex,
                scopeId,
                fileId,
                active: true,
            });
        } else {
            existing.active = true;
            existing.frameIndex = frameIndex;
        }

        if (frameIndex < this.firstSeenFrame) this.firstSeenFrame = frameIndex;
        if (frameIndex > this.lastSeenFrame) this.lastSeenFrame = frameIndex;
    }

    /**
     * Marks an alias as rebound/removed at a specific frame index.
     * @param {string} variableName
     * @param {number} frameIndex
     * @param {string} [scopeId='local']
     * @param {string} [fileId='main.py']
     */
    removeAlias(variableName, frameIndex, scopeId = 'local', fileId = 'main.py') {
        const existing = this.aliases.find(a => a.name === variableName && a.scopeId === scopeId && a.fileId === fileId);
        if (existing) {
            existing.active = false;
            existing.removedAtFrame = frameIndex;
        }
        if (frameIndex > this.lastSeenFrame) this.lastSeenFrame = frameIndex;
    }

    /**
     * Returns list of variable names referencing this object at a specific frame.
     * @param {number} [frameIndex]
     * @returns {string[]}
     */
    getVariables(frameIndex = null) {
        if (frameIndex === null) {
            return Array.from(new Set(this.aliases.map(a => a.name)));
        }

        const vars = new Set();
        for (const a of this.aliases) {
            if (a.frameIndex <= frameIndex) {
                if (!a.removedAtFrame || a.removedAtFrame > frameIndex) {
                    vars.add(a.name);
                }
            }
        }
        return Array.from(vars);
    }

    toJSON() {
        return {
            objectId: this.objectId,
            aliases: this.aliases,
            firstSeenFrame: this.firstSeenFrame,
            lastSeenFrame: this.lastSeenFrame,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new AliasSet(json);
    }
}
