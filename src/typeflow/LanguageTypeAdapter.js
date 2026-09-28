/**
 * LanguageTypeAdapter — Abstract base adapter for language-specific type and value semantics.
 */

export class LanguageTypeAdapter {
    constructor(language = 'generic') {
        this.language = language;
    }

    inferLiteral(raw) { throw new Error('Not implemented'); }
    inferBinaryOperation(op, leftVal, rightVal) { throw new Error('Not implemented'); }
    inferUnaryOperation(op, val) { throw new Error('Not implemented'); }
    inferComparison(op, leftVal, rightVal) { throw new Error('Not implemented'); }
    inferCall(calleeName, args) { throw new Error('Not implemented'); }
    inferBuiltin(name, args) { throw new Error('Not implemented'); }
    inferBranchNarrowing(condExpr, isTrueBranch, currentEnv) { throw new Error('Not implemented'); }
}
