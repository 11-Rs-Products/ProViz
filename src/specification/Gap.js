/**
 * Gap — Represents an untested specification, unreached path, surviving mutant, or regression gap.
 */

import { SpecificationConfidence } from './SpecificationConfidence.js';

export class Gap {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.kind
     * @param {string} [params.functionId='global']
     * @param {object|null} [params.location=null]
     * @param {string} [params.reason='']
     * @param {Array<string>} [params.evidence=[]]
     * @param {object|null} [params.suggestedObjective=null]
     * @param {object} [params.suggestedInputs={}]
     * @param {string} [params.confidence=SpecificationConfidence.HIGH_CONFIDENCE]
     * @param {number} [params.priority=0.8]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        kind,
        functionId = 'global',
        location = null,
        reason = '',
        evidence = [],
        suggestedObjective = null,
        suggestedInputs = {},
        confidence = SpecificationConfidence.HIGH_CONFIDENCE,
        priority = 0.8,
        metadata = {},
    } = {}) {
        this.kind = String(kind || 'UNKNOWN_BEHAVIOR');
        this.functionId = String(functionId || 'global');
        this.location = location ? Object.freeze({ ...location }) : null;
        this.reason = String(reason || '');
        this.evidence = Object.freeze([...evidence]);
        this.suggestedObjective = suggestedObjective ? Object.freeze({ ...suggestedObjective }) : null;
        this.suggestedInputs = Object.freeze({ ...suggestedInputs });
        this.confidence = confidence;
        this.priority = Number(priority);
        this.metadata = Object.freeze({ ...metadata });

        const hashPayload = JSON.stringify({
            kind: this.kind,
            functionId: this.functionId,
            location: this.location,
            reason: this.reason,
        });

        this.id = id || `gap_${Gap.computeHash(hashPayload)}`;
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
            functionId: this.functionId,
            location: this.location,
            reason: this.reason,
            evidence: this.evidence,
            suggestedObjective: this.suggestedObjective,
            suggestedInputs: this.suggestedInputs,
            confidence: this.confidence,
            priority: this.priority,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new Gap(json);
    }
}
