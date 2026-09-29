/**
 * TestValueGenerator — Deterministic generator of concrete values from symbolic constraints and type domains.
 */

import { TestValue, TEST_VALUE_TYPES } from './TestValue.js';

export class TestValueGenerator {
    /**
     * Generate a concrete TestValue from an interval [min, max] with optional disequalities and preferred objective.
     * @param {object} params
     * @param {number} [params.min=-Infinity]
     * @param {number} [params.max=Infinity]
     * @param {Set<number>} [params.excludedValues=new Set()]
     * @param {string} [params.strategy='BOUNDARY'] - 'BOUNDARY', 'ZERO_FAVORED', 'MINIMAL'
     * @param {object|null} [params.originConstraint=null]
     * @returns {TestValue}
     */
    static generateInteger({
        min = -Infinity,
        max = Infinity,
        excludedValues = new Set(),
        strategy = 'BOUNDARY',
        originConstraint = null,
    } = {}) {
        if (min > max) {
            return TestValue.unconstructable(`Invalid interval [${min}, ${max}]`, originConstraint);
        }

        // Candidate selection order
        const candidates = [];

        if (strategy === 'ZERO_FAVORED') {
            candidates.push(0, 1, -1);
        } else if (strategy === 'BOUNDARY') {
            if (Number.isFinite(min)) candidates.push(min, min + 1);
            if (Number.isFinite(max)) candidates.push(max, max - 1);
            candidates.push(0, 1, -1);
        } else {
            candidates.push(0, 1, min, max);
        }

        // Filter and pick first valid integer
        for (const c of candidates) {
            if (Number.isFinite(c) && c >= min && c <= max && !excludedValues.has(c)) {
                return TestValue.int(c, originConstraint);
            }
        }

        // Fallback to integer within range
        const effectiveMin = Number.isFinite(min) ? min : (Number.isFinite(max) ? max - 10 : 0);
        for (let i = effectiveMin; i <= (Number.isFinite(max) ? max : effectiveMin + 100); i++) {
            if (i >= min && i <= max && !excludedValues.has(i)) {
                return TestValue.int(i, originConstraint);
            }
        }

        return TestValue.unconstructable(`No valid integer satisfying [${min}, ${max}] with exclusions`, originConstraint);
    }

    /**
     * Generate a collection value (e.g. List) with specific length and element generator.
     */
    static generateList({
        length = 0,
        elementValue = 0,
        originConstraint = null,
    } = {}) {
        const len = Math.max(0, Math.min(100, Math.trunc(length)));
        const items = new Array(len).fill(elementValue);
        return TestValue.list(items, originConstraint);
    }

    /**
     * Generate dictionary containing specified keys.
     */
    static generateDict({
        requiredKeys = [],
        defaultValue = 0,
        originConstraint = null,
    } = {}) {
        const obj = {};
        for (const k of requiredKeys) {
            obj[k] = defaultValue;
        }
        return TestValue.dict(obj, originConstraint);
    }

    /**
     * Generate string of target length or default.
     */
    static generateString({
        length = 0,
        content = '',
        originConstraint = null,
    } = {}) {
        if (content) return TestValue.string(content, originConstraint);
        const len = Math.max(0, Math.min(100, Math.trunc(length)));
        return TestValue.string('a'.repeat(len), originConstraint);
    }
}
