/**
 * TestCase — Immutable specification of a generated test scenario.
 */

import { TEST_CASE_STATUSES } from './TestCaseStatus.js';
import { TEST_TARGET_KINDS } from './TestTargetKind.js';
import { TestInput } from './TestInput.js';
import { TestExpectation } from './TestExpectation.js';

export class TestCase {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {number} [params.workspaceVersion=1]
     * @param {string} [params.targetKind=TEST_TARGET_KINDS.FINDING]
     * @param {string} params.targetId
     * @param {TestInput|object} [params.inputs]
     * @param {TestExpectation|object} [params.expected]
     * @param {string|null} [params.symbolicPathId=null]
     * @param {string|null} [params.findingId=null]
     * @param {string|null} [params.counterexampleId=null]
     * @param {string} [params.status=TEST_CASE_STATUSES.GENERATED]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        workspaceVersion = 1,
        targetKind = TEST_TARGET_KINDS.FINDING,
        targetId,
        inputs = new TestInput(),
        expected = new TestExpectation(),
        symbolicPathId = null,
        findingId = null,
        counterexampleId = null,
        status = TEST_CASE_STATUSES.GENERATED,
        metadata = {},
    } = {}) {
        this.workspaceVersion = Number(workspaceVersion) || 1;
        this.targetKind = targetKind;
        this.targetId = String(targetId || '');
        this.inputs = inputs instanceof TestInput ? inputs : TestInput.fromJSON(inputs);
        this.expected = expected instanceof TestExpectation ? expected : TestExpectation.fromJSON(expected);
        this.symbolicPathId = symbolicPathId;
        this.findingId = findingId;
        this.counterexampleId = counterexampleId;
        this.status = status;
        this.metadata = Object.freeze({ ...metadata });

        const hashInput = JSON.stringify({
            targetKind: this.targetKind,
            targetId: this.targetId,
            inputs: this.inputs.toJSON(),
            expected: this.expected.toJSON(),
            findingId: this.findingId,
            symbolicPathId: this.symbolicPathId,
        });
        this.id = id || `test_${this.targetKind.toLowerCase()}_${this.targetId}_${TestCase.computeHash(hashInput)}`;
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

    withStatus(newStatus) {
        return new TestCase({
            id: this.id,
            workspaceVersion: this.workspaceVersion,
            targetKind: this.targetKind,
            targetId: this.targetId,
            inputs: this.inputs,
            expected: this.expected,
            symbolicPathId: this.symbolicPathId,
            findingId: this.findingId,
            counterexampleId: this.counterexampleId,
            status: newStatus,
            metadata: this.metadata,
        });
    }

    toJSON() {
        return {
            id: this.id,
            workspaceVersion: this.workspaceVersion,
            targetKind: this.targetKind,
            targetId: this.targetId,
            inputs: this.inputs.toJSON(),
            expected: this.expected.toJSON(),
            symbolicPathId: this.symbolicPathId,
            findingId: this.findingId,
            counterexampleId: this.counterexampleId,
            status: this.status,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new TestCase({
            id: json.id,
            workspaceVersion: json.workspaceVersion,
            targetKind: json.targetKind,
            targetId: json.targetId,
            inputs: TestInput.fromJSON(json.inputs),
            expected: TestExpectation.fromJSON(json.expected),
            symbolicPathId: json.symbolicPathId,
            findingId: json.findingId,
            counterexampleId: json.counterexampleId,
            status: json.status,
            metadata: json.metadata,
        });
    }
}
