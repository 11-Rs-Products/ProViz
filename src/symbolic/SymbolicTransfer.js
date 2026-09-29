/**
 * SymbolicTransfer — Evaluates symbolic expressions and transfers across CFG statements.
 */

import { SymbolicExpression } from './SymbolicExpression.js';
import { SymbolicOperation } from './SymbolicOperation.js';

export class SymbolicTransfer {
    /**
     * Transfer statement assignment into symbolic environment.
     * @param {object} node - CFG node
     * @param {import('./SymbolicState.js').SymbolicState} state
     * @returns {import('./SymbolicState.js').SymbolicState}
     */
    static transferStatement(node, state) {
        if (!node || !state) return state;
        const codeStr = String(node.statement?.expression || node.statement?.raw || node.label || '').trim();

        // Assignment: var = expr
        const assignMatch = codeStr.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
        if (assignMatch) {
            const varName = assignMatch[1];
            const exprStr = assignMatch[2].trim();

            const symExpr = this.parseExpression(exprStr, state);
            return state.withBinding(varName, symExpr);
        }

        return state;
    }

    static parseExpression(exprStr, state) {
        if (!exprStr) return SymbolicExpression.constant(null);

        // Literal number
        if (/^-?\d+(?:\.\d+)?$/.test(exprStr)) {
            const num = Number(exprStr);
            return SymbolicExpression.constant(num);
        }

        // Literal None
        if (exprStr === 'None') return SymbolicExpression.constant(null);

        // Literal Boolean
        if (exprStr === 'True') return SymbolicExpression.constant(true);
        if (exprStr === 'False') return SymbolicExpression.constant(false);

        // Literal String
        if ((exprStr.startsWith('"') && exprStr.endsWith('"')) || (exprStr.startsWith("'") && exprStr.endsWith("'"))) {
            return SymbolicExpression.constant(exprStr.slice(1, -1));
        }

        // Binary operation: a + b, a - b, a * b, a / b
        const binMatch = exprStr.match(/^([a-zA-Z_]\w*|\d+)\s*([\+\-\*\/])\s*([a-zA-Z_]\w*|\d+)$/);
        if (binMatch) {
            const lStr = binMatch[1];
            const op = binMatch[2];
            const rStr = binMatch[3];

            const left = this.parseAtom(lStr, state);
            const right = this.parseAtom(rStr, state);
            return SymbolicOperation.binary(op, left, right);
        }

        // Function call: len(xs), abs(x)
        const funcMatch = exprStr.match(/^([a-zA-Z_]\w*)\(([^)]*)\)$/);
        if (funcMatch) {
            const fName = funcMatch[1];
            const argsStr = funcMatch[2].trim();
            const args = argsStr ? argsStr.split(',').map(a => this.parseAtom(a.trim(), state)) : [];
            return SymbolicExpression.func(fName, args);
        }

        // Variable reference
        return this.parseAtom(exprStr, state);
    }

    static parseAtom(str, state) {
        if (/^-?\d+(?:\.\d+)?$/.test(str)) {
            return SymbolicExpression.constant(Number(str));
        }
        if (state.environment.has(str)) {
            return state.environment.get(str);
        }
        return SymbolicExpression.symbol(str);
    }
}
