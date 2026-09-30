/**
 * BoundaryAnalyzer — Extracts semantic boundary points from specifications, conditions, and types.
 */

import { BoundaryPoint } from './BoundaryPoint.js';
import { BoundaryModel } from './BoundaryModel.js';

export class BoundaryAnalyzer {
    /**
     * @param {string} target
     * @param {object} [context={}]
     * @returns {BoundaryModel}
     */
    static extractBoundaries(target, context = {}) {
        const points = [];
        const param = context.parameter || target;

        // Core canonical boundaries
        points.push(new BoundaryPoint({ value: 0, kind: 'ZERO', parameter: param, reason: 'Zero boundary' }));
        points.push(new BoundaryPoint({ value: 1, kind: 'POSITIVE_UNIT', parameter: param, reason: 'Unit positive' }));
        points.push(new BoundaryPoint({ value: -1, kind: 'NEGATIVE_UNIT', parameter: param, reason: 'Unit negative' }));
        points.push(new BoundaryPoint({ value: null, kind: 'NULL', parameter: param, reason: 'Null boundary' }));

        // Check if specifications contain explicit constant comparisons (e.g. x == 10 or b == 0)
        if (context.specifications) {
            for (const spec of context.specifications) {
                const cond = spec.condition || spec.expression || '';
                const match = cond.match(/([a-zA-Z0-9_]+)\s*(?:==|!=|>|<|>=|<=)\s*([0-9.-]+)/);
                if (match && (!param || match[1] === param)) {
                    const cVal = Number(match[2]);
                    points.push(new BoundaryPoint({ value: cVal, kind: 'EXPLICIT_SPEC', parameter: match[1], reason: `Spec constant ${cVal}` }));
                    points.push(new BoundaryPoint({ value: cVal - 1, kind: 'OFF_BY_ONE_LOW', parameter: match[1], reason: `Off-by-one lower ${cVal - 1}` }));
                    points.push(new BoundaryPoint({ value: cVal + 1, kind: 'OFF_BY_ONE_HIGH', parameter: match[1], reason: `Off-by-one upper ${cVal + 1}` }));
                }
            }
        }

        // Deduplicate values
        const unique = [];
        const seen = new Set();
        for (const p of points) {
            const key = String(p.value);
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(p);
            }
        }

        return new BoundaryModel({
            target,
            points: unique,
        });
    }

    static analyzeNumericBounds({ min = -100, max = 100 } = {}) {
        const points = [];
        points.push(new BoundaryPoint({ value: 0, kind: 'ZERO', reason: 'Zero boundary' }));
        points.push(new BoundaryPoint({ value: 1, kind: 'POSITIVE_UNIT', reason: 'Unit positive' }));
        points.push(new BoundaryPoint({ value: -1, kind: 'NEGATIVE_UNIT', reason: 'Unit negative' }));
        points.push(new BoundaryPoint({ value: min, kind: 'MIN_BOUND', reason: `Min boundary ${min}` }));
        points.push(new BoundaryPoint({ value: max, kind: 'MAX_BOUND', reason: `Max boundary ${max}` }));
        points.push(new BoundaryPoint({ value: min + 1, kind: 'OFF_BY_ONE_MIN', reason: `Min + 1` }));
        points.push(new BoundaryPoint({ value: max - 1, kind: 'OFF_BY_ONE_MAX', reason: `Max - 1` }));
        return points;
    }

    static extractFromSource(sourceCode = '') {
        const points = [];
        const regex = /(?:if|elif|while)\s+([a-zA-Z0-9_]+)\s*(==|!=|>|<|>=|<=)\s*(-?[0-9]+)/g;
        let match;
        while ((match = regex.exec(sourceCode)) !== null) {
            const param = match[1];
            const val = Number(match[3]);
            points.push(new BoundaryPoint({ value: val, kind: 'EXPLICIT_SOURCE', parameter: param, reason: `Condition boundary ${val}` }));
            points.push(new BoundaryPoint({ value: val - 1, kind: 'OFF_BY_ONE_LOW', parameter: param, reason: `Condition off-by-one lower ${val - 1}` }));
            points.push(new BoundaryPoint({ value: val + 1, kind: 'OFF_BY_ONE_HIGH', parameter: param, reason: `Condition off-by-one upper ${val + 1}` }));
        }
        return points;
    }
}
