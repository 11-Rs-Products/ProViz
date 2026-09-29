/**
 * PythonConcolicAdapter — Python-specific adapter for concolic execution and harness preparation.
 */

import { LanguageConcolicAdapter } from './LanguageConcolicAdapter.js';
import { PythonTestingAdapter } from '../testing/PythonTestingAdapter.js';

export class PythonConcolicAdapter extends LanguageConcolicAdapter {
    constructor() {
        super();
        this.language = 'python';
        this._testingAdapter = new PythonTestingAdapter();
    }

    createTestHarness(sourceCode = '', testCase = null) {
        return this._testingAdapter.createTestHarness(sourceCode, testCase);
    }
}
