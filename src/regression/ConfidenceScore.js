/**
 * ConfidenceScore — Formal confidence assessment with explicit evidence provenance.
 */

import { CHANGE_CONFIDENCES, CONFIDENCE_WEIGHTS } from './ChangeConfidence.js';

export class ConfidenceScore {
    /**
     * @param {object} params
     * @param {string} [params.level=CHANGE_CONFIDENCES.HIGH_CONFIDENCE]
     * @param {number} [params.value=0.85]
     * @param {Array<string>} [params.evidence=[]]
     * @param {string} [params.rationale='']
     */
    constructor({
        level = CHANGE_CONFIDENCES.HIGH_CONFIDENCE,
        value = null,
        evidence = [],
        rationale = '',
    } = {}) {
        this.level = level;
        this.value = typeof value === 'number' ? value : (CONFIDENCE_WEIGHTS[level] || 0.5);
        this.evidence = Object.freeze([...evidence]);
        this.rationale = String(rationale || '');
        Object.freeze(this);
    }

    toJSON() {
        return {
            level: this.level,
            value: this.value,
            evidence: this.evidence,
            rationale: this.rationale,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ConfidenceScore(json);
    }
}
