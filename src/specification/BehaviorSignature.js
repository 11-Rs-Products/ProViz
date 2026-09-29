/**
 * BehaviorSignature — Canonical behavioral signature for structural comparison.
 */

export class BehaviorSignature {
    /**
     * @param {object} params
     * @param {string} [params.functionName='']
     * @param {string} [params.outcome='RETURN'] - RETURN, EXCEPTION, DIVERGE
     * @param {string} [params.valueType='undefined']
     * @param {string} [params.valueSummary='']
     * @param {string|null} [params.exceptionType=null]
     * @param {string|null} [params.pathCondition=null]
     * @param {Array<string>} [params.mutationSummary=[]]
     */
    constructor({
        functionName = '',
        outcome = 'RETURN',
        valueType = 'undefined',
        valueSummary = '',
        exceptionType = null,
        pathCondition = null,
        mutationSummary = [],
    } = {}) {
        this.functionName = functionName;
        this.outcome = outcome;
        this.valueType = valueType;
        this.valueSummary = String(valueSummary);
        this.exceptionType = exceptionType;
        this.pathCondition = pathCondition;
        this.mutationSummary = Object.freeze([...mutationSummary]);

        const key = `${functionName}:${outcome}:${valueType}:${valueSummary}:${exceptionType || ''}:${pathCondition || ''}`;
        this.signatureKey = key;
        Object.freeze(this);
    }

    static fromObservation(obs) {
        if (!obs) return new BehaviorSignature();
        const outcome = obs.exception ? 'EXCEPTION' : 'RETURN';
        const exType = obs.exception ? (obs.exception.type || obs.exception.name || 'Exception') : null;
        const valType = typeof obs.returnValue;
        const valSummary = obs.returnValue !== undefined ? JSON.stringify(obs.returnValue) : '';
        const mutations = (obs.heapMutations || []).map(m => `${m.target || ''}.${m.op || ''}`);

        return new BehaviorSignature({
            functionName: obs.functionId,
            outcome,
            valueType: valType,
            valueSummary: valSummary,
            exceptionType: exType,
            pathCondition: obs.symbolicPathId,
            mutationSummary: mutations,
        });
    }

    equals(other) {
        if (!(other instanceof BehaviorSignature)) return false;
        return this.signatureKey === other.signatureKey;
    }

    toJSON() {
        return {
            functionName: this.functionName,
            outcome: this.outcome,
            valueType: this.valueType,
            valueSummary: this.valueSummary,
            exceptionType: this.exceptionType,
            pathCondition: this.pathCondition,
            mutationSummary: this.mutationSummary,
            signatureKey: this.signatureKey,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new BehaviorSignature(json);
    }
}
