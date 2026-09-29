/**
 * Invariant — Program invariant specification and inferred fact container.
 */

import { PROPERTY_STATES } from './PropertyState.js';

export class Invariant {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.expression - e.g. "x >= 0", "len(xs) > 0"
     * @param {string} [params.target]
     * @param {string} [params.scope] - functionId or '<module>'
     * @param {string} [params.status] - PROPERTY_STATES member
     * @param {string} [params.confidence]
     * @param {Array<object>} [params.evidence]
     * @param {object} [params.sourceLocation]
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        expression,
        target = '',
        scope = '<module>',
        status = PROPERTY_STATES.PROVEN,
        confidence = 'STATIC_INFERENCE',
        evidence = [],
        sourceLocation = null,
        metadata = {},
    }) {
        this.expression = String(expression || '').trim();
        this.target = String(target || '');
        this.scope = String(scope || '<module>');
        this.status = status;
        this.confidence = confidence;
        this.evidence = Object.freeze([...evidence]);
        this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
        this.metadata = Object.freeze({ ...metadata });

        const hashSeed = `${this.scope}:${this.target}:${this.expression}`;
        this.id = id || `inv_${this.scope}_${Invariant.computeHash(hashSeed)}`;
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
            expression: this.expression,
            target: this.target,
            scope: this.scope,
            status: this.status,
            confidence: this.confidence,
            evidence: this.evidence,
            sourceLocation: this.sourceLocation,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Invariant(json);
    }
}
