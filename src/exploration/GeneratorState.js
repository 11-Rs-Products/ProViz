/**
 * GeneratorState — Mutable or frozen generation execution statistics and history.
 */

export class GeneratorState {
    /**
     * @param {object} params
     * @param {number} [params.generatedCount=0]
     * @param {number} [params.acceptedCount=0]
     * @param {number} [params.rejectedCount=0]
     * @param {Array<string>} [params.recentOutputs=[]]
     */
    constructor({
        generatedCount = 0,
        acceptedCount = 0,
        rejectedCount = 0,
        recentOutputs = [],
    } = {}) {
        this.generatedCount = Number(generatedCount);
        this.acceptedCount = Number(acceptedCount);
        this.rejectedCount = Number(rejectedCount);
        this.recentOutputs = Object.freeze([...recentOutputs]);
        Object.freeze(this);
    }

    record(val, accepted = true) {
        return new GeneratorState({
            generatedCount: this.generatedCount + 1,
            acceptedCount: this.acceptedCount + (accepted ? 1 : 0),
            rejectedCount: this.rejectedCount + (accepted ? 0 : 1),
            recentOutputs: [...this.recentOutputs.slice(-20), String(val)],
        });
    }

    toJSON() {
        return {
            generatedCount: this.generatedCount,
            acceptedCount: this.acceptedCount,
            rejectedCount: this.rejectedCount,
            recentOutputs: this.recentOutputs,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new GeneratorState(json);
    }
}
