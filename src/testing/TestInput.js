/**
 * TestInput — Immutable specification of inputs for a TestCase.
 */

import { TEST_INPUT_KINDS } from './TestInputKind.js';
import { TestValue } from './TestValue.js';

export class TestInput {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} [params.kind=TEST_INPUT_KINDS.MODULE_INPUTS]
     * @param {Map<string, TestValue|*>|object} [params.bindings={}]
     * @param {object} [params.files={}]
     * @param {object} [params.environment={}]
     * @param {string|null} [params.source=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        kind = TEST_INPUT_KINDS.MODULE_INPUTS,
        bindings = {},
        files = {},
        environment = {},
        source = null,
        metadata = {},
    } = {}) {
        this.kind = kind;
        this.files = Object.freeze({ ...files });
        this.environment = Object.freeze({ ...environment });
        this.source = source;
        this.metadata = Object.freeze({ ...metadata });

        const rawBindings = bindings instanceof Map ? Object.fromEntries(bindings.entries()) : (bindings || {});
        const normalized = {};
        for (const [k, v] of Object.entries(rawBindings)) {
            normalized[k] = v instanceof TestValue ? v : new TestValue({ value: v });
        }
        this.bindings = Object.freeze(normalized);

        const hash = TestInput.computeHash(JSON.stringify({ kind: this.kind, bindings: this.toJSON().bindings, files: this.files }));
        this.id = id || `input_${hash}`;
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

    getBinding(name) {
        return this.bindings[name] || null;
    }

    hasBinding(name) {
        return Object.prototype.hasOwnProperty.call(this.bindings, name);
    }

    toJSON() {
        const serializedBindings = {};
        for (const [k, v] of Object.entries(this.bindings)) {
            serializedBindings[k] = v.toJSON ? v.toJSON() : v;
        }
        return {
            id: this.id,
            kind: this.kind,
            bindings: serializedBindings,
            files: this.files,
            environment: this.environment,
            source: this.source,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return new TestInput();
        const bindings = {};
        if (json.bindings) {
            for (const [k, v] of Object.entries(json.bindings)) {
                bindings[k] = TestValue.fromJSON(v);
            }
        }
        return new TestInput({
            id: json.id,
            kind: json.kind,
            bindings,
            files: json.files,
            environment: json.environment,
            source: json.source,
            metadata: json.metadata,
        });
    }
}
