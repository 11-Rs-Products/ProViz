/**
 * ChangeImpact — Structured impact summary associated with a semantic change.
 */

import { CHANGE_SEVERITIES } from './ChangeSeverity.js';
import { CHANGE_CONFIDENCES } from './ChangeConfidence.js';

export class ChangeImpact {
    /**
     * @param {object} params
     * @param {string} [params.severity=CHANGE_SEVERITIES.MINOR]
     * @param {string} [params.confidence=CHANGE_CONFIDENCES.HIGH_CONFIDENCE]
     * @param {Array<string>} [params.affectedSymbols=[]]
     * @param {Array<string>} [params.affectedFunctions=[]]
     * @param {Array<string>} [params.affectedModules=[]]
     * @param {Array<string>} [params.affectedTests=[]]
     * @param {Array<string>} [params.reasons=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        severity = CHANGE_SEVERITIES.MINOR,
        confidence = CHANGE_CONFIDENCES.HIGH_CONFIDENCE,
        affectedSymbols = [],
        affectedFunctions = [],
        affectedModules = [],
        affectedTests = [],
        reasons = [],
        metadata = {},
    } = {}) {
        this.severity = severity;
        this.confidence = confidence;
        this.affectedSymbols = Object.freeze([...affectedSymbols]);
        this.affectedFunctions = Object.freeze([...affectedFunctions]);
        this.affectedModules = Object.freeze([...affectedModules]);
        this.affectedTests = Object.freeze([...affectedTests]);
        this.reasons = Object.freeze([...reasons]);
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            severity: this.severity,
            confidence: this.confidence,
            affectedSymbols: this.affectedSymbols,
            affectedFunctions: this.affectedFunctions,
            affectedModules: this.affectedModules,
            affectedTests: this.affectedTests,
            reasons: this.reasons,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new ChangeImpact(json);
    }
}
