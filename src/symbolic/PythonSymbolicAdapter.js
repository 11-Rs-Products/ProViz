/**
 * PythonSymbolicAdapter — Python-specific symbolic execution rules, built-in models, and operators.
 */

import { LanguageSymbolicAdapter } from './LanguageSymbolicAdapter.js';

export class PythonSymbolicAdapter extends LanguageSymbolicAdapter {
    constructor() {
        super('python');
    }

    isSafeArithmetic(op, left, right) {
        if (op === '/') {
            // Unsafe if divisor is zero
            if (right && right.isConstant() && right.payload.isZero()) return false;
        }
        return true;
    }
}
