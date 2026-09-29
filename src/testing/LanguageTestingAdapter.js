/**
 * LanguageTestingAdapter — Base adapter interface for language-specific test generation and execution.
 */

export class LanguageTestingAdapter {
    constructor() {
        this.language = 'generic';
    }

    createTestHarness(sourceCode, testCase) {
        return sourceCode;
    }

    extractObservation(executionResult) {
        return null;
    }
}
