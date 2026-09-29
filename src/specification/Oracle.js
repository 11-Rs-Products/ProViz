/**
 * Oracle — First-class behavioral test oracle.
 */

import { OracleKind } from './OracleKind.js';
import { OracleConfidence } from './OracleConfidence.js';
import { OracleExpression } from './OracleExpression.js';

export class Oracle {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} [params.kind=OracleKind.RETURN_VALUE]
     * @param {string} [params.confidence=OracleConfidence.EXACT]
     * @param {string|null} [params.specificationId=null]
     * @param {OracleExpression|object|string} [params.expression]
     * @param {any} [params.expected]
     * @param {string|null} [params.expectedException=null]
     * @param {Array<string>} [params.evidence=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        kind = OracleKind.RETURN_VALUE,
        confidence = OracleConfidence.EXACT,
        specificationId = null,
        expression = null,
        expected = undefined,
        expectedException = null,
        evidence = [],
        metadata = {},
    } = {}) {
        this.kind = kind;
        this.confidence = confidence;
        this.specificationId = specificationId;
        if (expression instanceof OracleExpression) {
            this.expression = expression;
        } else if (expression && typeof expression === 'object') {
            this.expression = OracleExpression.fromJSON(expression);
        } else if (typeof expression === 'string') {
            this.expression = new OracleExpression({ expression });
        } else {
            this.expression = null;
        }
        this.expected = expected;
        this.expectedException = expectedException;
        this.evidence = Object.freeze([...evidence]);
        this.metadata = Object.freeze({ ...metadata });

        const hashPayload = JSON.stringify({
            kind: this.kind,
            confidence: this.confidence,
            specificationId: this.specificationId,
            expression: this.expression ? this.expression.toJSON() : null,
            expected: this.expected,
            expectedException: this.expectedException,
        });

        this.id = id || `oracle_${Oracle.computeHash(hashPayload)}`;
        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    toJSON() {
        return {
            id: this.id,
            kind: this.kind,
            confidence: this.confidence,
            specificationId: this.specificationId,
            expression: this.expression ? this.expression.toJSON() : null,
            expected: this.expected,
            expectedException: this.expectedException,
            evidence: this.evidence,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Oracle(json);
    }
}
