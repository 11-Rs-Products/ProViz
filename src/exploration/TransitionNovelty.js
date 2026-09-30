/**
 * TransitionNovelty — Transition novelty descriptor.
 */

export class TransitionNovelty {
    constructor({ transitionId, fromState, toState, isNewTransition = true } = {}) {
        this.transitionId = String(transitionId || '');
        this.fromState = String(fromState || '');
        this.toState = String(toState || '');
        this.isNewTransition = Boolean(isNewTransition);
        Object.freeze(this);
    }

    toJSON() {
        return {
            transitionId: this.transitionId,
            fromState: this.fromState,
            toState: this.toState,
            isNewTransition: this.isNewTransition,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TransitionNovelty(json);
    }
}
