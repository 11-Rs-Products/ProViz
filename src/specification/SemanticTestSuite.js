/**
 * SemanticTestSuite — Immutable collection of synthesized SemanticTestCases.
 */

import { SemanticTestCase } from './SemanticTestCase.js';

export class SemanticTestSuite {
    /**
     * @param {Array<SemanticTestCase>} [tests=[]]
     * @param {object} [metadata={}]
     */
    constructor(tests = [], metadata = {}) {
        this.tests = Object.freeze(tests.map(t => t instanceof SemanticTestCase ? t : SemanticTestCase.fromJSON(t)));
        this.metadata = Object.freeze({ ...metadata });

        const byId = new Map();
        const byFunction = new Map();

        for (const test of this.tests) {
            byId.set(test.id, test);
            if (!byFunction.has(test.targetFunction)) byFunction.set(test.targetFunction, []);
            byFunction.get(test.targetFunction).push(test);
        }

        this._byId = byId;
        this._byFunction = byFunction;
        Object.freeze(this);
    }

    get size() {
        return this.tests.length;
    }

    get(id) {
        return this._byId.get(id) || null;
    }

    has(id) {
        return this._byId.has(id);
    }

    getByFunction(functionId) {
        return Object.freeze([...(this._byFunction.get(functionId) || [])]);
    }

    add(test) {
        if (this.has(test.id)) return this;
        return new SemanticTestSuite([...this.tests, test], this.metadata);
    }

    addAll(tests) {
        const list = [...this.tests];
        for (const t of tests) {
            if (!this.has(t.id)) {
                list.push(t);
            }
        }
        return new SemanticTestSuite(list, this.metadata);
    }

    map(fn) {
        return this.tests.map(fn);
    }

    filter(predicate) {
        return new SemanticTestSuite(this.tests.filter(predicate), this.metadata);
    }

    [Symbol.iterator]() {
        return this.tests[Symbol.iterator]();
    }

    toJSON() {
        return {
            tests: this.tests.map(t => t.toJSON()),
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || !Array.isArray(json.tests)) {
            return new SemanticTestSuite([]);
        }
        return new SemanticTestSuite(json.tests.map(t => SemanticTestCase.fromJSON(t)), json.metadata);
    }
}
