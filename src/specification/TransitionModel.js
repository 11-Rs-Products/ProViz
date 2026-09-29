/**
 * TransitionModel — Models an observed or inferred state transition (fromState -> toState).
 */

export class TransitionModel {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.fromStateId
     * @param {string} params.toStateId
     * @param {string} [params.trigger='']
     * @param {string} [params.guard='']
     * @param {Array<string>} [params.evidence=[]]
     */
    constructor({
        id = null,
        fromStateId,
        toStateId,
        trigger = '',
        guard = '',
        evidence = [],
    } = {}) {
        this.fromStateId = String(fromStateId || '');
        this.toStateId = String(toStateId || '');
        this.trigger = trigger;
        this.guard = guard;
        this.evidence = Object.freeze([...evidence]);

        const key = `${this.fromStateId}->${this.trigger}[${this.guard}]->${this.toStateId}`;
        this.id = id || `trans_${TransitionModel.computeHash(key)}`;
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
            id: this.id,
            fromStateId: this.fromStateId,
            toStateId: this.toStateId,
            trigger: this.trigger,
            guard: this.guard,
            evidence: this.evidence,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TransitionModel(json);
    }
}
