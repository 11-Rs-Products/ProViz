/**
 * PythonVerificationAdapter — Python-specific verification semantics and built-in safety summaries.
 */

import { LanguageVerificationAdapter } from './LanguageVerificationAdapter.js';

export class PythonVerificationAdapter extends LanguageVerificationAdapter {
    constructor() {
        super('python');
        this.pureBuiltins = new Set([
            'len', 'abs', 'min', 'max', 'sum', 'range', 'enumerate', 'zip', 'type', 'isinstance',
            'int', 'float', 'str', 'bool', 'list', 'tuple', 'set', 'dict'
        ]);
    }

    isPureBuiltin(name) {
        return this.pureBuiltins.has(name);
    }

    isSafeOperation(operator, leftKind, rightKind) {
        if (operator === '+') {
            if ((leftKind === 'string' && rightKind === 'int') || (leftKind === 'int' && rightKind === 'string')) {
                return false;
            }
        }
        return true;
    }

    inferPotentialExceptions(expression, context) {
        const exceptions = [];
        const str = String(expression || '').trim();

        if (/\/\s*0(?!\.)/.test(str)) {
            exceptions.push('ZeroDivisionError');
        }
        if (/\[.*\]/.test(str)) {
            exceptions.push('IndexError');
        }
        if (/\.[a-zA-Z_]\w*/.test(str)) {
            exceptions.push('AttributeError');
        }

        return exceptions;
    }
}
