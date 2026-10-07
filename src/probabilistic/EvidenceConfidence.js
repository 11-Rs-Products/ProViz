/**
 * EvidenceConfidence — Quantifies confidence score and qualitative level associated with an individual evidence item.
 */

import { CONFIDENCE_LEVELS } from './ConfidenceScale.js';

export class EvidenceConfidence {
    constructor({
        score = 0.5,
        level = CONFIDENCE_LEVELS.MEDIUM,
        rationale = '',
        calibratedAt = null,
    } = {}) {
        this.score = Math.max(0, Math.min(1, Number(score) || 0));
        this.level = level;
        this.rationale = String(rationale || '');
        this.calibratedAt = calibratedAt || Date.now();
        Object.freeze(this);
    }

    toJSON() {
        return {
            score: this.score,
            level: this.level,
            rationale: this.rationale,
            calibratedAt: this.calibratedAt,
        };
    }

    static fromJSON(json) {
        if (!json) return new EvidenceConfidence();
        return new EvidenceConfidence(json);
    }
}
