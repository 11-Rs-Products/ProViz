/**
 * StateTransition — Specification of state progression from fromState to toState under condition.
 */

import { Specification } from './Specification.js';
import { SpecificationKind } from './SpecificationKind.js';

export class StateTransition extends Specification {
    /**
     * @param {object} params
     * @param {object|string} params.fromState
     * @param {string} [params.condition='']
     * @param {string} [params.transition='']
     * @param {object|string} params.toState
     */
    constructor(params = {}) {
        super({
            ...params,
            kind: SpecificationKind.STATE_TRANSITION,
        });
        this.fromState = typeof params.fromState === 'string' ? params.fromState : Object.freeze({ ...(params.fromState || {}) });
        this.condition = params.condition || '';
        this.transition = params.transition || '';
        this.toState = typeof params.toState === 'string' ? params.toState : Object.freeze({ ...(params.toState || {}) });
        Object.freeze(this);
    }

    toJSON() {
        return {
            ...super.toJSON(),
            fromState: this.fromState,
            condition: this.condition,
            transition: this.transition,
            toState: this.toState,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new StateTransition(json);
    }
}
