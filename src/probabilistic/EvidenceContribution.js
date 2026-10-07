/**
 * EvidenceContribution — Measures how much an individual evidence item shifted confidence/probability.
 */

export class EvidenceContribution {
    constructor({
        evidenceId,
        subject = 'general',
        priorConfidence = 0.5,
        posteriorConfidence = 0.5,
        shift = 0.0,
        confidenceShift = null,
        informationGain = 0.0,
        informationGainBits = null,
        rationale = '',
    } = {}) {
        this.evidenceId = String(evidenceId);
        this.subject = String(subject);
        this.priorConfidence = Number(priorConfidence) || 0;
        this.posteriorConfidence = Number(posteriorConfidence) || 0;
        this.shift = confidenceShift !== null ? Number(confidenceShift) : (Number(shift) || (this.posteriorConfidence - this.priorConfidence));
        this.confidenceShift = this.shift;
        this.informationGain = informationGainBits !== null ? Number(informationGainBits) : (Number(informationGain) || Math.abs(this.shift));
        this.informationGainBits = this.informationGain;
        this.rationale = String(rationale || '');
        Object.freeze(this);
    }

    toJSON() {
        return {
            evidenceId: this.evidenceId,
            subject: this.subject,
            priorConfidence: this.priorConfidence,
            posteriorConfidence: this.posteriorConfidence,
            shift: this.shift,
            confidenceShift: this.confidenceShift,
            informationGain: this.informationGain,
            informationGainBits: this.informationGainBits,
            rationale: this.rationale,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new EvidenceContribution(json);
    }
}
