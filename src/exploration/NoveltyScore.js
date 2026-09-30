/**
 * NoveltyScore — Computed novelty metric [0.0, 1.0] and component contributions.
 */

export class NoveltyScore {
    /**
     * @param {object} params
     * @param {number} [params.total=0.0]
     * @param {number} [params.branchNovelty=0.0]
     * @param {number} [params.valueNovelty=0.0]
     * @param {number} [params.exceptionNovelty=0.0]
     * @param {number} [params.pathNovelty=0.0]
     */
    constructor({
        total = 0.0,
        branchNovelty = 0.0,
        valueNovelty = 0.0,
        exceptionNovelty = 0.0,
        pathNovelty = 0.0,
        isNovel = undefined,
    } = {}) {
        this.total = Math.min(1.0, Math.max(0.0, Number(total)));
        this.branchNovelty = Number(branchNovelty);
        this.valueNovelty = Number(valueNovelty);
        this.exceptionNovelty = Number(exceptionNovelty);
        this.pathNovelty = Number(pathNovelty);
        this.isNovel = isNovel !== undefined ? Boolean(isNovel) : this.total > 0.0;
        Object.freeze(this);
    }

    toJSON() {
        return {
            total: this.total,
            branchNovelty: this.branchNovelty,
            valueNovelty: this.valueNovelty,
            exceptionNovelty: this.exceptionNovelty,
            pathNovelty: this.pathNovelty,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new NoveltyScore(json);
    }
}
