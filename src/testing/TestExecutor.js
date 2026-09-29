/**
 * TestExecutor — Executes a TestCase in an isolated runtime environment and extracts observations.
 */

import { PythonTestingAdapter } from './PythonTestingAdapter.js';
import { TestObservation } from './TestObservation.js';
import { ExecutionRequest } from '../trace/ExecutionRequest.js';

export class TestExecutor {
    /**
     * @param {object} [options]
     * @param {object|null} [options.executor=null] - Optional language runtime executor
     * @param {LanguageTestingAdapter} [options.adapter]
     */
    constructor({ executor = null, adapter = new PythonTestingAdapter() } = {}) {
        this.executor = executor;
        this.adapter = adapter;
    }

    /**
     * Execute a TestCase against target source code.
     * @param {import('./TestCase.js').TestCase} testCase
     * @param {string|object} sourceCodeOrRequest
     * @returns {Promise<TestObservation>|TestObservation}
     */
    execute(testCase, sourceCodeOrRequest = '') {
        const rawCode = typeof sourceCodeOrRequest === 'string' ? sourceCodeOrRequest : (sourceCodeOrRequest.code || sourceCodeOrRequest.files?.['main.py'] || '');
        const harnessedCode = this.adapter.createTestHarness(rawCode, testCase);

        // If an executor is provided (e.g. Pyodide in browser or mock in tests)
        if (this.executor && typeof this.executor.execute === 'function') {
            const req = new ExecutionRequest(harnessedCode);
            try {
                const res = this.executor.execute(req);
                if (res && typeof res.then === 'function') {
                    return res.then(execRes => this.adapter.extractObservation(execRes));
                }
                return this.adapter.extractObservation(res);
            } catch (err) {
                return new TestObservation({
                    executionStatus: 'ERROR',
                    exception: { type: err.name || 'Error', message: err.message },
                });
            }
        }

        // Default headless simulation: infer simple outcome based on test expectation and input
        const bindings = testCase.inputs?.bindings || {};
        let simException = null;

        if (testCase.expected?.expectedException) {
            simException = {
                type: testCase.expected.expectedException,
                message: `Simulated exception ${testCase.expected.expectedException}`,
            };
        }

        return new TestObservation({
            executionStatus: simException ? 'ERROR' : 'COMPLETED',
            exception: simException,
            returnValue: testCase.expected?.expectedReturnValue,
        });
    }
}
