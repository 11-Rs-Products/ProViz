/**
 * FindingEvidence — Structured evidence underpinning a verification finding.
 */

import { FINDING_STATUSES } from './FindingStatus.js';

export class FindingEvidence {
    /**
     * @param {object} [params]
     * @param {string} [params.kind] - FINDING_STATUSES member
     * @param {string} [params.description]
     * @param {object} [params.sourceLocation]
     * @param {Array<string>} [params.pathConditions]
     * @param {Array<string>} [params.definingSSAValues]
     * @param {Array<string>} [params.possibleTypes]
     * @param {object|null} [params.range]
     * @param {string|null} [params.nullability]
     * @param {Array<number>} [params.observedFrames]
     * @param {Array<any>} [params.observedValues]
     * @param {object} [params.metadata]
     */
    constructor({
        kind = FINDING_STATUSES.STATIC_INFERENCE,
        description = '',
        sourceLocation = null,
        pathConditions = [],
        definingSSAValues = [],
        possibleTypes = [],
        range = null,
        nullability = null,
        observedFrames = [],
        observedValues = [],
        metadata = {},
    } = {}) {
        this.kind = kind;
        this.description = String(description || '');
        this.sourceLocation = sourceLocation ? Object.freeze({ ...sourceLocation }) : null;
        this.pathConditions = Object.freeze([...pathConditions]);
        this.definingSSAValues = Object.freeze([...definingSSAValues]);
        this.possibleTypes = Object.freeze([...possibleTypes]);
        this.range = range ? Object.freeze({ ...range }) : null;
        this.nullability = nullability;
        this.observedFrames = Object.freeze([...observedFrames]);
        this.observedValues = Object.freeze([...observedValues]);
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            kind: this.kind,
            description: this.description,
            sourceLocation: this.sourceLocation,
            pathConditions: this.pathConditions,
            definingSSAValues: this.definingSSAValues,
            possibleTypes: this.possibleTypes,
            range: this.range,
            nullability: this.nullability,
            observedFrames: this.observedFrames,
            observedValues: this.observedValues,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new FindingEvidence(json);
    }
}
