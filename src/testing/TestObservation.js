/**
 * TestObservation — Immutable record of observed runtime behavior during test execution.
 */

import { Coverage } from './Coverage.js';

export class TestObservation {
    /**
     * @param {object} params
     * @param {string} [params.executionStatus='COMPLETED'] - 'COMPLETED', 'ERROR', 'TIMEOUT'
     * @param {Array<object>} [params.frames=[]]
     * @param {object|null} [params.trace=null]
     * @param {object|null} [params.finalState=null]
     * @param {object|null} [params.exception=null]
     * @param {*} [params.returnValue=undefined]
     * @param {Coverage|object} [params.coverage=new Coverage()]
     * @param {Array<string>} [params.observedProperties=[]]
     * @param {Array<string>} [params.observedPath=[]]
     * @param {Array<object>} [params.runtimeObjects=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        executionStatus = 'COMPLETED',
        frames = [],
        trace = null,
        finalState = null,
        exception = null,
        returnValue = undefined,
        coverage = new Coverage(),
        observedProperties = [],
        observedPath = [],
        runtimeObjects = [],
        metadata = {},
    } = {}) {
        this.executionStatus = executionStatus;
        this.frames = Object.freeze([...frames]);
        this.trace = trace;
        this.finalState = finalState;
        this.exception = exception ? Object.freeze({ ...exception }) : null;
        this.returnValue = returnValue;
        this.coverage = coverage instanceof Coverage ? coverage : Coverage.fromJSON(coverage);
        this.observedProperties = Object.freeze([...observedProperties]);
        this.observedPath = Object.freeze([...observedPath]);
        this.runtimeObjects = Object.freeze([...runtimeObjects]);
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            executionStatus: this.executionStatus,
            frames: this.frames,
            trace: this.trace ? (this.trace.toJSON ? this.trace.toJSON() : this.trace) : null,
            finalState: this.finalState ? (this.finalState.toJSON ? this.finalState.toJSON() : this.finalState) : null,
            exception: this.exception,
            returnValue: this.returnValue,
            coverage: this.coverage.toJSON(),
            observedProperties: this.observedProperties,
            observedPath: this.observedPath,
            runtimeObjects: this.runtimeObjects,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return new TestObservation();
        return new TestObservation(json);
    }
}
