/**
 * RangeAnalyzer — Infers variable numeric ranges along CFG and SSA definitions.
 */

import { RangeValue } from './RangeValue.js';

export class RangeAnalyzer {
    /**
     * Infer range mappings for all variables across CFG nodes.
     * @param {object} cfg
     * @param {object} [typeInference]
     * @returns {Map<string, RangeValue>} - Map from varName/ssaId -> RangeValue
     */
    analyze(cfg, typeInference = null) {
        const ranges = new Map();
        if (!cfg) return ranges;

        // If typeInference is available, pull initial constants
        if (typeInference?.latestBindings) {
            for (const [varName, absVal] of typeInference.latestBindings.entries()) {
                const constVal = absVal?.getConstant?.();
                if (constVal && (constVal.type === 'int' || constVal.type === 'float' || typeof constVal.value === 'number')) {
                    ranges.set(varName, RangeValue.exact(constVal.value, constVal.type === 'int' || Number.isInteger(constVal.value)));
                }
            }
        }

        // Iterate over CFG nodes to refine statements
        for (const node of cfg.getNodes()) {
            if (!node.statement) continue;
            const stmt = node.statement;
            const target = stmt.target || stmt.variable;
            const expr = String(stmt.expression || stmt.value || stmt.raw || '').trim();

            if (!target) continue;

            if (/^-?\d+(?:\.\d+)?$/.test(expr)) {
                const num = Number(expr);
                ranges.set(target, RangeValue.exact(num, Number.isInteger(num)));
            } else {
                const binMatch = expr.match(/^([a-zA-Z_]\w*)\s*([\+\-\*\/])\s*(-?\d+(?:\.\d+)?)$/);
                if (binMatch) {
                    const lVar = binMatch[1];
                    const op = binMatch[2];
                    const rNum = Number(binMatch[3]);
                    const lRange = ranges.get(lVar) || RangeValue.unknown();
                    const rRange = RangeValue.exact(rNum);

                    let res = RangeValue.unknown();
                    if (op === '+') res = lRange.add(rRange);
                    else if (op === '-') res = lRange.sub(rRange);
                    else if (op === '*') res = lRange.mul(rRange);
                    else if (op === '/') res = lRange.div(rRange);

                    ranges.set(target, res);
                }
            }
        }

        return ranges;
    }
}
