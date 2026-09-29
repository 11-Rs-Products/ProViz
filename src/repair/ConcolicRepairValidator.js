/**
 * ConcolicRepairValidator — Executes counterexamples dynamically against the patched workspace to verify reproduction avoidance.
 */

import { TestExecutor } from '../testing/TestExecutor.js';
import { TestCase } from '../testing/TestCase.js';
import { TestInput } from '../testing/TestInput.js';

export class ConcolicRepairValidator {
    /**
     * Run dynamic concolic validation against patched source code.
     *
     * @param {import('./RepairCandidate.js').RepairCandidate} candidate
     * @param {string} patchedCode
     * @param {object} [context={}]
     * @param {object} [context.counterexample=null]
     * @returns {{ valid: boolean, reproduced: boolean, observation: object, details: object }}
     */
    static validate(candidate, patchedCode, context = {}) {
        const executor = new TestExecutor();

        let bindings = { x: 0 };
        if (context.counterexample?.bindings) {
            bindings = context.counterexample.bindings;
        } else if (context.counterexample?.input?.bindings) {
            bindings = context.counterexample.input.bindings;
        }

        const testInput = new TestInput({ bindings });
        const testCase = new TestCase({
            input: testInput,
            targetKind: 'REPAIR_VALIDATION',
        });

        const execution = executor.execute(testCase, patchedCode);
        const observation = execution?.observation || execution || {};

        // Valid if execution completed without an unhandled error/exception
        const unhandledException = observation?.exception && !candidate.strategy.includes('EXCEPTION');
        const valid = !unhandledException;

        return {
            valid,
            reproduced: !valid,
            observation,
            details: {
                eventsCount: observation.events?.length || 0,
                returnRecorded: observation.returnedValue !== undefined,
                exceptionRecorded: Boolean(observation.exception),
            },
        };
    }
}
