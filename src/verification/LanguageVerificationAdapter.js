/**
 * LanguageVerificationAdapter — Base interface for language-specific verification logic and safe abstractions.
 */

export class LanguageVerificationAdapter {
    constructor(language = 'generic') {
        this.language = language;
    }

    isPureBuiltin(name) {
        return false;
    }

    isSafeOperation(operator, leftType, rightType) {
        return true;
    }

    inferPotentialExceptions(expression, context) {
        return [];
    }
}
