/**
 * PythonTestingAdapter — Python-specific harness generator and trace observation extractor.
 */

import { LanguageTestingAdapter } from './LanguageTestingAdapter.js';
import { TestObservation } from './TestObservation.js';
import { CoverageAnalyzer } from './CoverageAnalyzer.js';
import { TEST_VALUE_TYPES } from './TestValue.js';

export class PythonTestingAdapter extends LanguageTestingAdapter {
    constructor() {
        super();
        this.language = 'python';
    }

    /**
     * Format a concrete value into Python syntax.
     */
    formatValue(testVal) {
        if (!testVal) return 'None';
        const v = testVal.value !== undefined ? testVal.value : testVal;

        if (v === null || v === undefined) return 'None';
        if (typeof v === 'boolean') return v ? 'True' : 'False';
        if (typeof v === 'number') return String(v);
        if (typeof v === 'string') return JSON.stringify(v);
        if (Array.isArray(v)) return `[${v.map(item => this.formatValue(item)).join(', ')}]`;
        if (typeof v === 'object') {
            const pairs = Object.entries(v).map(([k, val]) => `${JSON.stringify(k)}: ${this.formatValue(val)}`);
            return `{${pairs.join(', ')}}`;
        }
        return 'None';
    }

    /**
     * Create isolated executable Python code for a TestCase.
     * @param {string} sourceCode
     * @param {import('./TestCase.js').TestCase} testCase
     * @returns {string}
     */
    createTestHarness(sourceCode = '', testCase = null) {
        if (!testCase || !testCase.inputs) return sourceCode;

        const bindings = testCase.inputs.bindings || {};
        const prefixLines = [];

        for (const [varName, testVal] of Object.entries(bindings)) {
            prefixLines.push(`${varName} = ${this.formatValue(testVal)}`);
        }

        if (prefixLines.length === 0) return sourceCode;

        return `${prefixLines.join('\n')}\n${sourceCode}`;
    }

    /**
     * Extract a TestObservation from execution trace events and optional exception.
     * @param {object} params
     * @param {Array<object>} [params.traceEvents=[]]
     * @param {object|null} [params.exception=null]
     * @param {*} [params.returnValue=undefined]
     * @param {object|null} [params.cfg=null]
     * @returns {TestObservation}
     */
    extractObservation({ traceEvents = [], exception = null, returnValue = undefined, cfg = null } = {}) {
        const coverage = CoverageAnalyzer.analyzeTrace(traceEvents, cfg);
        const status = exception ? 'ERROR' : 'COMPLETED';

        return new TestObservation({
            executionStatus: status,
            frames: traceEvents,
            exception,
            returnValue,
            coverage,
            observedPath: traceEvents.map(e => e.cfgNodeId || e.line).filter(Boolean),
        });
    }
}
