/**
 * PathCondition — Represents a branch condition or predicate governing path execution.
 */

import { RangeValue } from './RangeValue.js';

export class PathCondition {
    /**
     * @param {object} params
     * @param {string} params.subject - Variable or expression subject
     * @param {string} params.operator - '==', '!=', '<', '<=', '>', '>=', 'is', 'is not', 'isinstance', 'truthy', 'falsy'
     * @param {any} [params.target] - Target value, type, or identifier
     * @param {boolean} [params.isNegated=false]
     * @param {object} [params.sourceLocation]
     * @param {string} [params.rawText]
     */
    constructor({
        subject,
        operator,
        target = null,
        isNegated = false,
        sourceLocation = null,
        rawText = '',
    }) {
        this.subject = String(subject || '').trim();
        this.operator = String(operator || 'truthy').trim();
        this.target = target;
        this.isNegated = Boolean(isNegated);
        this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
        this.rawText = rawText || `${this.subject} ${this.operator} ${this.target !== null ? JSON.stringify(this.target) : ''}`.trim();
        Object.freeze(this);
    }

    static isNone(subject, sourceLocation = null) {
        return new PathCondition({ subject, operator: 'is', target: 'None', sourceLocation, rawText: `${subject} is None` });
    }

    static isNotNone(subject, sourceLocation = null) {
        return new PathCondition({ subject, operator: 'is not', target: 'None', sourceLocation, rawText: `${subject} is not None` });
    }

    static comparison(subject, operator, target, sourceLocation = null) {
        return new PathCondition({ subject, operator, target, sourceLocation });
    }

    static isinstance(subject, targetType, sourceLocation = null) {
        return new PathCondition({ subject, operator: 'isinstance', target: targetType, sourceLocation, rawText: `isinstance(${subject}, ${targetType})` });
    }

    static truthy(subject, sourceLocation = null) {
        return new PathCondition({ subject, operator: 'truthy', target: true, sourceLocation, rawText: `bool(${subject})` });
    }

    static falsy(subject, sourceLocation = null) {
        return new PathCondition({ subject, operator: 'falsy', target: false, sourceLocation, rawText: `not bool(${subject})` });
    }

    negate() {
        let op = this.operator;
        let neg = !this.isNegated;
        let tgt = this.target;

        if (op === 'is' && tgt === 'None') {
            return new PathCondition({ subject: this.subject, operator: 'is not', target: 'None', sourceLocation: this.sourceLocation });
        }
        if (op === 'is not' && tgt === 'None') {
            return new PathCondition({ subject: this.subject, operator: 'is', target: 'None', sourceLocation: this.sourceLocation });
        }
        if (op === '==') return new PathCondition({ subject: this.subject, operator: '!=', target: tgt, sourceLocation: this.sourceLocation });
        if (op === '!=') return new PathCondition({ subject: this.subject, operator: '==', target: tgt, sourceLocation: this.sourceLocation });
        if (op === '<') return new PathCondition({ subject: this.subject, operator: '>=', target: tgt, sourceLocation: this.sourceLocation });
        if (op === '<=') return new PathCondition({ subject: this.subject, operator: '>', target: tgt, sourceLocation: this.sourceLocation });
        if (op === '>') return new PathCondition({ subject: this.subject, operator: '<=', target: tgt, sourceLocation: this.sourceLocation });
        if (op === '>=') return new PathCondition({ subject: this.subject, operator: '<', target: tgt, sourceLocation: this.sourceLocation });
        if (op === 'truthy') return new PathCondition({ subject: this.subject, operator: 'falsy', target: false, sourceLocation: this.sourceLocation });
        if (op === 'falsy') return new PathCondition({ subject: this.subject, operator: 'truthy', target: true, sourceLocation: this.sourceLocation });

        return new PathCondition({
            subject: this.subject,
            operator: op,
            target: tgt,
            isNegated: neg,
            sourceLocation: this.sourceLocation,
        });
    }

    /**
     * Refines a RangeValue based on this condition.
     * @param {RangeValue} existingRange
     * @returns {RangeValue}
     */
    applyToRange(existingRange) {
        const range = existingRange || RangeValue.unknown();
        const targetNum = typeof this.target === 'number' ? this.target : null;

        if (targetNum === null) return range;

        switch (this.operator) {
            case '==':
                return range.intersect(RangeValue.exact(targetNum));
            case '!=':
                if (range.isExact() && range.min === targetNum) return RangeValue.empty();
                return range;
            case '<':
                return range.intersect(new RangeValue(-Infinity, targetNum - 1));
            case '<=':
                return range.intersect(new RangeValue(-Infinity, targetNum));
            case '>':
                return range.intersect(new RangeValue(targetNum + 1, Infinity));
            case '>=':
                return range.intersect(new RangeValue(targetNum, Infinity));
            default:
                return range;
        }
    }

    equals(other) {
        if (!other || !(other instanceof PathCondition)) return false;
        return (
            this.subject === other.subject &&
            this.operator === other.operator &&
            this.target === other.target &&
            this.isNegated === other.isNegated
        );
    }

    toString() {
        return this.rawText;
    }

    toJSON() {
        return {
            subject: this.subject,
            operator: this.operator,
            target: this.target,
            isNegated: this.isNegated,
            sourceLocation: this.sourceLocation,
            rawText: this.rawText,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new PathCondition(json);
    }
}
