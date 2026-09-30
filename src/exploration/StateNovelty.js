/**
 * StateNovelty — State novelty descriptor.
 */

export class StateNovelty {
    constructor({ stateId, isNewState = true } = {}) {
        this.stateId = String(stateId || '');
        this.isNewState = Boolean(isNewState);
        Object.freeze(this);
    }

    toJSON() {
        return {
            stateId: this.stateId,
            isNewState: this.isNewState,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new StateNovelty(json);
    }
}
