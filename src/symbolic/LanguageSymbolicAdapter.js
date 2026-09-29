/**
 * LanguageSymbolicAdapter — Base adapter contract for language-specific symbolic abstractions.
 */

export class LanguageSymbolicAdapter {
    constructor(language = 'generic') {
        this.language = language;
    }

    isSafeArithmetic(op, left, right) {
        return true;
    }
}
