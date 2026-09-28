/**
 * TypeTransfer — Evaluates expressions and statement semantics to compute AbstractValues.
 */

import { AbstractValue, VALUE_CONFIDENCE } from './AbstractValue.js';
import { PythonTypeAdapter } from './PythonTypeAdapter.js';

export class TypeTransfer {
    /**
     * @param {object} [options]
     * @param {import('./LanguageTypeAdapter.js').LanguageTypeAdapter} [options.adapter]
     */
    constructor({ adapter = null } = {}) {
        this.adapter = adapter || new PythonTypeAdapter();
    }

    /**
     * Evaluates a statement or expression string in a given TypeEnvironment.
     */
    evaluateExpression(exprStr, env) {
        if (!exprStr || typeof exprStr !== 'string') return AbstractValue.unknown();
        const trimmed = exprStr.trim();

        // 1. Literal?
        const litVal = this.adapter.inferLiteral(trimmed);
        if (!litVal.typeSet.isUnknown()) return litVal;

        // 2. Simple Variable Lookup?
        if (/^[a-zA-Z_]\w*$/.test(trimmed)) {
            const bound = env.get(trimmed);
            if (bound) return bound;
        }

        // 3. Built-in Function Call? (e.g. len(x), abs(-5), int("42"))
        const callMatch = trimmed.match(/^([a-zA-Z_]\w*)\((.*)\)$/);
        if (callMatch) {
            const fnName = callMatch[1];
            const rawArgs = callMatch[2].trim() ? callMatch[2].split(',').map(a => a.trim()) : [];
            const argVals = rawArgs.map(a => this.evaluateExpression(a, env));
            return this.adapter.inferBuiltin(fnName, argVals);
        }

        // 4. Binary Expression? (e.g. a + b, x * 2, count == 0)
        const binMatch = trimmed.match(/^(.+?)\s*(\+|\-|\*|\/\/|\/|\%|\*\*|==|!=|<=|>=|<|>|is not|is|in|not in|and|or)\s*(.+)$/);
        if (binMatch) {
            const leftExpr = binMatch[1].trim();
            const op = binMatch[2].trim();
            const rightExpr = binMatch[3].trim();

            const leftVal = this.evaluateExpression(leftExpr, env);
            const rightVal = this.evaluateExpression(rightExpr, env);
            return this.adapter.inferBinaryOperation(op, leftVal, rightVal);
        }

        // 5. Unary Expression? (e.g. not flag, -x)
        const unMatch = trimmed.match(/^(not|-|\+)\s*(.+)$/);
        if (unMatch) {
            const op = unMatch[1];
            const subExpr = unMatch[2].trim();
            const subVal = this.evaluateExpression(subExpr, env);
            return this.adapter.inferUnaryOperation(op, subVal);
        }

        // 6. Indexing? (e.g. items[0], map["key"])
        const indexMatch = trimmed.match(/^([a-zA-Z_]\w*)\[(.+)\]$/);
        if (indexMatch) {
            const containerName = indexMatch[1];
            const cVal = env.get(containerName);
            if (cVal && cVal.shape && cVal.shape.elementTypes && !cVal.shape.elementTypes.isEmpty()) {
                return AbstractValue.fromType(cVal.shape.elementTypes.first());
            }
            if (cVal && cVal.shape && cVal.shape.valueTypes && !cVal.shape.valueTypes.isEmpty()) {
                return AbstractValue.fromType(cVal.shape.valueTypes.first());
            }
        }

        // 7. Attribute Access? (e.g. obj.field)
        const attrMatch = trimmed.match(/^([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)$/);
        if (attrMatch) {
            const objName = attrMatch[1];
            const fieldName = attrMatch[2];
            const objVal = env.get(objName);
            if (objVal && objVal.shape && objVal.shape.getField) {
                const fVal = objVal.shape.getField(fieldName);
                if (fVal) return fVal;
            }
        }

        return AbstractValue.unknown();
    }
}
