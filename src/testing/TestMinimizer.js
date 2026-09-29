/**
 * TestMinimizer — Deterministically reduces test inputs while preserving target constraints.
 */

import { TestCase } from './TestCase.js';
import { TestInput } from './TestInput.js';
import { TestValue, TEST_VALUE_TYPES } from './TestValue.js';

export class TestMinimizer {
    /**
     * Minimize the inputs of a TestCase without violating target constraints.
     * @param {TestCase} testCase
     * @returns {TestCase}
     */
    static minimize(testCase) {
        if (!testCase || !testCase.inputs) return testCase;

        const originalBindings = testCase.inputs.bindings;
        const minimizedBindings = {};

        for (const [varName, testVal] of Object.entries(originalBindings)) {
            if (!(testVal instanceof TestValue)) {
                minimizedBindings[varName] = testVal;
                continue;
            }

            if (testVal.type === TEST_VALUE_TYPES.INT) {
                // Minimize integer magnitude towards 0 or 1
                const v = testVal.value;
                if (v > 1) {
                    minimizedBindings[varName] = TestValue.int(1, testVal.originConstraint, testVal.symbolId);
                } else if (v < -1) {
                    minimizedBindings[varName] = TestValue.int(-1, testVal.originConstraint, testVal.symbolId);
                } else {
                    minimizedBindings[varName] = testVal;
                }
            } else if (testVal.type === TEST_VALUE_TYPES.STRING) {
                // Minimize string to single character or empty if length allows
                minimizedBindings[varName] = TestValue.string(testVal.value.length > 0 ? 'a' : '', testVal.originConstraint, testVal.symbolId);
            } else if (testVal.type === TEST_VALUE_TYPES.LIST) {
                // Minimize list to 1 element if non-empty
                minimizedBindings[varName] = TestValue.list(testVal.value.length > 0 ? [0] : [], testVal.originConstraint, testVal.symbolId);
            } else {
                minimizedBindings[varName] = testVal;
            }
        }

        const nextInput = new TestInput({
            kind: testCase.inputs.kind,
            bindings: minimizedBindings,
            files: testCase.inputs.files,
            environment: testCase.inputs.environment,
            source: testCase.inputs.source,
        });

        return new TestCase({
            id: `min_${testCase.id}`,
            workspaceVersion: testCase.workspaceVersion,
            targetKind: testCase.targetKind,
            targetId: testCase.targetId,
            inputs: nextInput,
            expected: testCase.expected,
            symbolicPathId: testCase.symbolicPathId,
            findingId: testCase.findingId,
            counterexampleId: testCase.counterexampleId,
            status: testCase.status,
            metadata: { ...testCase.metadata, minimized: true },
        });
    }
}
