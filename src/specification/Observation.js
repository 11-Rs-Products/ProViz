/**
 * Observation — Immutable record of a concrete execution point or function invocation.
 */

export class Observation {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} [params.functionId='']
     * @param {object} [params.inputs={}]
     * @param {any} [params.returnValue=undefined]
     * @param {object|null} [params.exception=null]
     * @param {object} [params.preState={}]
     * @param {object} [params.postState={}]
     * @param {Array<string>} [params.callStack=[]]
     * @param {Array<object>} [params.heapMutations=[]]
     * @param {object} [params.watchValues={}]
     * @param {Array<number|string>} [params.coveredLines=[]]
     * @param {string|null} [params.symbolicPathId=null]
     * @param {string|null} [params.traceId=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        functionId = '',
        inputs = {},
        returnValue = undefined,
        exception = null,
        preState = {},
        postState = {},
        callStack = [],
        heapMutations = [],
        watchValues = {},
        coveredLines = [],
        symbolicPathId = null,
        traceId = null,
        metadata = {},
    } = {}) {
        this.functionId = String(functionId || '');
        this.inputs = Object.freeze({ ...inputs });
        this.returnValue = returnValue;
        this.exception = exception ? Object.freeze({ ...exception }) : null;
        this.preState = Object.freeze({ ...preState });
        this.postState = Object.freeze({ ...postState });
        this.callStack = Object.freeze([...callStack]);
        this.heapMutations = Object.freeze([...heapMutations]);
        this.watchValues = Object.freeze({ ...watchValues });
        this.coveredLines = Object.freeze([...coveredLines]);
        this.symbolicPathId = symbolicPathId;
        this.traceId = traceId;
        this.metadata = Object.freeze({ ...metadata });

        const hashPayload = JSON.stringify({
            functionId: this.functionId,
            inputs: this.inputs,
            returnValue: this.returnValue,
            exception: this.exception,
            preState: this.preState,
            postState: this.postState,
            symbolicPathId: this.symbolicPathId,
        });

        this.id = id || `obs_${Observation.computeHash(hashPayload)}`;
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
            functionId: this.functionId,
            inputs: this.inputs,
            returnValue: this.returnValue,
            exception: this.exception,
            preState: this.preState,
            postState: this.postState,
            callStack: this.callStack,
            heapMutations: this.heapMutations,
            watchValues: this.watchValues,
            coveredLines: this.coveredLines,
            symbolicPathId: this.symbolicPathId,
            traceId: this.traceId,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Observation(json);
    }
}
