/**
 * PathNovelty — Path novelty descriptor.
 */

export class PathNovelty {
    constructor({ pathId, isNewlyReachable = true } = {}) {
        this.pathId = String(pathId || '');
        this.isNewlyReachable = Boolean(isNewlyReachable);
        Object.freeze(this);
    }

    toJSON() {
        return {
            pathId: this.pathId,
            isNewlyReachable: this.isNewlyReachable,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new PathNovelty(json);
    }
}
