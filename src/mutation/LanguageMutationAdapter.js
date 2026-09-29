/**
 * LanguageMutationAdapter — Abstract base adapter for language-specific mutation transformation.
 */

export class LanguageMutationAdapter {
    constructor(language = 'generic') {
        this.language = language;
    }

    enumerateMutationSites(sourceCode, context = {}) {
        throw new Error('enumerateMutationSites must be implemented by subclass');
    }

    buildMutations(site, sourceCode) {
        throw new Error('buildMutations must be implemented by subclass');
    }

    validateMutation(mutatedCode) {
        throw new Error('validateMutation must be implemented by subclass');
    }
}
