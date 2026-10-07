/**
 * LanguageProbabilisticAdapter — Base class for language-specific probabilistic analysis hooks.
 */

export class LanguageProbabilisticAdapter {
    constructor(language = 'generic') {
        this.language = language;
    }

    extractFeatures(sourceCode, executionContext = {}) {
        return {
            language: this.language,
            complexity: 1,
            functions: [],
        };
    }

    normalizeOutput(output) {
        return output;
    }
}
