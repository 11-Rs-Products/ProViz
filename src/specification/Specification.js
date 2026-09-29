/**
 * Specification — Universal immutable behavioral specification.
 */

import { SpecificationKind } from './SpecificationKind.js';
import { SpecificationStatus } from './SpecificationStatus.js';
import { SpecificationConfidence } from './SpecificationConfidence.js';
import { SpecificationSource } from './SpecificationSource.js';

export class Specification {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.kind
     * @param {string} [params.status=SpecificationStatus.CANDIDATE]
     * @param {string} [params.confidence=SpecificationConfidence.OBSERVED_ONLY]
     * @param {string} [params.source=SpecificationSource.RUNTIME_OBSERVATION]
     * @param {object|string} params.subject
     * @param {Array<any>} [params.preconditions=[]]
     * @param {Array<any>} [params.postconditions=[]]
     * @param {Array<string>} [params.observations=[]]
     * @param {Array<string>} [params.evidence=[]]
     * @param {Array<object>} [params.sourceLocations=[]]
     * @param {Array<string>} [params.sourceTests=[]]
     * @param {string|null} [params.derivedFrom=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        kind = SpecificationKind.INVARIANT,
        status = SpecificationStatus.CANDIDATE,
        confidence = SpecificationConfidence.OBSERVED_ONLY,
        source = SpecificationSource.RUNTIME_OBSERVATION,
        subject = {},
        preconditions = [],
        postconditions = [],
        observations = [],
        evidence = [],
        sourceLocations = [],
        sourceTests = [],
        derivedFrom = null,
        metadata = {},
    } = {}) {
        this.kind = kind;
        this.status = status;
        this.confidence = confidence;
        this.source = source;
        this.subject = typeof subject === 'string' ? { name: subject } : Object.freeze({ ...subject });
        this.preconditions = Object.freeze([...preconditions]);
        this.postconditions = Object.freeze([...postconditions]);
        this.observations = Object.freeze([...observations]);
        this.evidence = Object.freeze([...evidence]);
        this.sourceLocations = Object.freeze([...sourceLocations]);
        this.sourceTests = Object.freeze([...sourceTests]);
        this.derivedFrom = derivedFrom;
        this.metadata = Object.freeze({ ...metadata });

        const hashPayload = JSON.stringify({
            kind: this.kind,
            source: this.source,
            subject: this.subject,
            preconditions: this.preconditions,
            postconditions: this.postconditions,
            derivedFrom: this.derivedFrom,
            locations: this.sourceLocations,
        });

        this.id = id || `spec_${Specification.computeHash(hashPayload)}`;

        if (new.target === Specification) {
            Object.freeze(this);
        }
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    withStatus(status) {
        return new Specification({
            ...this,
            status,
        });
    }

    withConfidence(confidence) {
        return new Specification({
            ...this,
            confidence,
        });
    }

    withEvidence(newEvidence) {
        return new Specification({
            ...this,
            evidence: [...this.evidence, ...newEvidence],
        });
    }

    toJSON() {
        return {
            id: this.id,
            kind: this.kind,
            status: this.status,
            confidence: this.confidence,
            source: this.source,
            subject: this.subject,
            preconditions: this.preconditions,
            postconditions: this.postconditions,
            observations: this.observations,
            evidence: this.evidence,
            sourceLocations: this.sourceLocations,
            sourceTests: this.sourceTests,
            derivedFrom: this.derivedFrom,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Specification(json);
    }
}
