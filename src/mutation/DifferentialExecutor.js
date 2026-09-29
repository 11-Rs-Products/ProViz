/**
 * DifferentialExecutor — Executes identical test inputs against both original and mutant workspaces in isolation.
 */

import { TestExecutor } from '../testing/TestExecutor.js';
import { MutationComparator } from './MutationComparator.js';

export class DifferentialExecutor {
    /**
     * @param {object} [options]
     */
    constructor(options = {}) {
        this.executor = new TestExecutor(options);
    }

    /**
     * Execute testCase against original and mutated source code.
     *
     * @param {import('../testing/TestCase.js').TestCase} testCase
     * @param {string} originalSource
     * @param {string} mutatedSource
     * @param {object} [options={}]
     * @returns {{ killed: boolean, originalObs: object, mutantObs: object, comparison: object }}
     */
    executePair(testCase, originalSource, mutatedSource, options = {}) {
        const origRes = this.executor.execute(testCase, originalSource);
        const mutRes = this.executor.execute(testCase, mutatedSource);

        let origObs = origRes?.observation || origRes || {};
        let mutObs = mutRes?.observation || mutRes || {};

        // In headless mode, simulate observation values from input bindings safely
        const bindings = testCase.inputs?.bindings || testCase.input?.bindings || {};
        const simulatedOrig = this._safeSimulate(originalSource, bindings);
        const simulatedMut = this._safeSimulate(mutatedSource, bindings);

        if (simulatedOrig) {
            origObs = { ...origObs, ...simulatedOrig };
        }
        if (simulatedMut) {
            mutObs = { ...mutObs, ...simulatedMut };
        }

        const comparison = MutationComparator.compare(origObs, mutObs, options.oracles || []);

        return {
            killed: comparison.killed,
            originalObs: origObs,
            mutantObs: mutObs,
            comparison,
        };
    }

    _safeSimulate(sourceCode, bindings) {
        if (!sourceCode) return null;
        const match = sourceCode.match(/return\s+([^\n]+)/);
        if (!match) return null;
        const expr = match[1].trim();

        // Check if there is an if-guard before return
        const ifMatch = sourceCode.match(/if\s+([^:]+):\s*\n\s*return\s+([^\n]+)/);
        if (ifMatch) {
            const cond = ifMatch[1].trim();
            const condRes = this._evalExpr(cond, bindings);
            if (condRes === true) {
                const retVal = this._evalExpr(ifMatch[2].trim(), bindings);
                return { returnedValue: retVal };
            }
        }

        const res = this._evalExpr(expr, bindings);
        if (res && res.exception) {
            return { exception: res.exception };
        }
        return { returnedValue: res };
    }

    _evalExpr(expr, bindings) {
        const resolve = (val) => {
            const v = String(val).trim();
            if (bindings[v] !== undefined) {
                const b = bindings[v];
                return b?.value !== undefined ? b.value : b;
            }
            if (!isNaN(Number(v))) return Number(v);
            if (v === 'True' || v === 'true') return true;
            if (v === 'False' || v === 'false') return false;
            if (v === 'None' || v === 'null') return null;
            return v;
        };

        const binaryMatch = expr.match(/^(.+?)\s*(==|!=|<=|>=|<|>|\+|\-|\*|\/|and|or)\s*(.+)$/);
        if (binaryMatch) {
            const left = resolve(binaryMatch[1]);
            const op = binaryMatch[2];
            const right = resolve(binaryMatch[3]);

            if (op === '+') return left + right;
            if (op === '-') return left - right;
            if (op === '*') return left * right;
            if (op === '/') {
                if (right === 0) return { exception: { type: 'ZeroDivisionError', message: 'division by zero' } };
                return left / right;
            }
            if (op === '==') return left === right;
            if (op === '!=') return left !== right;
            if (op === '<') return left < right;
            if (op === '<=') return left <= right;
            if (op === '>') return left > right;
            if (op === '>=') return left >= right;
            if (op === 'and') return Boolean(left && right);
            if (op === 'or') return Boolean(left || right);
        }

        return resolve(expr);
    }
}
