/**
 * Property — Canonical representation of a verifiable program property.
 */

import { PROPERTY_KINDS } from './PropertyKind.js';
import { PROPERTY_STATES } from './PropertyState.js';
import { PropertyValue } from './PropertyValue.js';

export class Property {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.kind - PROPERTY_KINDS member
     * @param {string} params.target - Variable, SSA value, or expression target
     * @param {PropertyValue|any} [params.value]
     * @param {string} [params.state] - PROPERTY_STATES member (PROVEN, DISPROVEN, POSSIBLE, UNKNOWN)
     * @param {string} [params.confidence] - 'STATIC_GUARANTEE' | 'STATIC_INFERENCE' | 'DYNAMIC_OBSERVATION' | 'HEURISTIC' | 'UNKNOWN'
     * @param {Array<object>} [params.evidence]
     * @param {object} [params.sourceLocation]
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        kind,
        target,
        value = null,
        state = PROPERTY_STATES.UNKNOWN,
        confidence = 'STATIC_INFERENCE',
        evidence = [],
        sourceLocation = null,
        metadata = {},
    }) {
        this.kind = kind || PROPERTY_KINDS.NON_NULL;
        this.target = String(target || '');
        this.value = value instanceof PropertyValue ? value : (value ? PropertyValue.raw(value) : null);
        this.state = state || PROPERTY_STATES.UNKNOWN;
        this.confidence = confidence;
        this.evidence = Object.freeze([...evidence]);
        this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
        this.metadata = Object.freeze({ ...metadata });

        const valStr = this.value ? JSON.stringify(this.value.toJSON()) : '';
        const targetClean = this.target.replace(/[^a-zA-Z0-9_]/g, '_');
        this.id = id || `prop_${this.kind.toLowerCase()}_${targetClean}_${Property.computeHash(`${this.kind}:${this.target}:${valStr}`)}`;

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

    isProven() {
        return this.state === PROPERTY_STATES.PROVEN;
    }

    isDisproven() {
        return this.state === PROPERTY_STATES.DISPROVEN;
    }

    isPossible() {
        return this.state === PROPERTY_STATES.POSSIBLE;
    }

    isUnknown() {
        return this.state === PROPERTY_STATES.UNKNOWN;
    }

    withState(newState, confidence = this.confidence, newEvidence = this.evidence) {
        return new Property({
            id: this.id,
            kind: this.kind,
            target: this.target,
            value: this.value,
            state: newState,
            confidence: confidence,
            evidence: newEvidence,
            sourceLocation: this.sourceLocation,
            metadata: this.metadata,
        });
    }

    equals(other) {
        if (!other || !(other instanceof Property)) return false;
        return (
            this.id === other.id &&
            this.state === other.state &&
            this.confidence === other.confidence
        );
    }

    toJSON() {
        return {
            id: this.id,
            kind: this.kind,
            target: this.target,
            value: this.value ? this.value.toJSON() : null,
            state: this.state,
            confidence: this.confidence,
            evidence: this.evidence,
            sourceLocation: this.sourceLocation,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Property({
            ...json,
            value: json.value ? PropertyValue.fromJSON(json.value) : null,
        });
    }
}
