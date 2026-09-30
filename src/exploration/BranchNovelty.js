/**
 * BranchNovelty / PathNovelty / StateNovelty / TransitionNovelty — Descriptors of novelty in execution structure.
 */

export class BranchNovelty {
    constructor({ branchId, condition, isNewlyCovered = true } = {}) {
        this.branchId = String(branchId || '');
        this.condition = String(condition || '');
        this.isNewlyCovered = Boolean(isNewlyCovered);
        Object.freeze(this);
    }
}

export class PathNovelty {
    constructor({ pathId, isNewlyReachable = true } = {}) {
        this.pathId = String(pathId || '');
        this.isNewlyReachable = Boolean(isNewlyReachable);
        Object.freeze(this);
    }
}

export class StateNovelty {
    constructor({ stateId, isNewState = true } = {}) {
        this.stateId = String(stateId || '');
        this.isNewState = Boolean(isNewState);
        Object.freeze(this);
    }
}

export class TransitionNovelty {
    constructor({ transitionId, fromState, toState, isNewTransition = true } = {}) {
        this.transitionId = String(transitionId || '');
        this.fromState = String(fromState || '');
        this.toState = String(toState || '');
        this.isNewTransition = Boolean(isNewTransition);
        Object.freeze(this);
    }
}
