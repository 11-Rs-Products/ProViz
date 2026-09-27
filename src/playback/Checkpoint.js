/**
 * Checkpoint — Immutable snapshot of RuntimeState at a specific timeline frame index.
 */

import { RuntimeState } from '../runtime/RuntimeState.js';

export class Checkpoint {
    /**
     * @param {number} index - Frame index
     * @param {RuntimeState} state - RuntimeState instance
     */
    constructor(index, state) {
        this.index = index;
        this.state = state instanceof RuntimeState ? state.clone() : new RuntimeState(state);
    }

    /**
     * Get an isolated clone of the checkpoint's RuntimeState.
     * @returns {RuntimeState}
     */
    getStateClone() {
        return this.state.clone();
    }
}
