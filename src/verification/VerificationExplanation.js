/**
 * VerificationExplanation — Structured explanation builder for verification findings and properties.
 */

export class VerificationExplanation {
    /**
     * @param {object} params
     * @param {string} params.findingId
     * @param {string} params.kind
     * @param {string} params.summary
     * @param {Array<string>} [params.steps]
     * @param {Array<object>} [params.evidence]
     * @param {Array<string>} [params.path]
     * @param {string} [params.confidence]
     */
    constructor({
        findingId,
        kind,
        summary,
        steps = [],
        evidence = [],
        path = [],
        confidence = 'STATIC_INFERENCE',
    }) {
        this.findingId = String(findingId);
        this.kind = String(kind);
        this.summary = String(summary);
        this.steps = Object.freeze([...steps]);
        this.evidence = Object.freeze([...evidence]);
        this.path = Object.freeze([...path]);
        this.confidence = confidence;
        Object.freeze(this);
    }

    static explainFinding(finding, cfg = null, ssa = null) {
        if (!finding) return null;

        const steps = [];
        steps.push(`Finding: ${finding.message}`);
        steps.push(`Severity: ${finding.severity} (${finding.confidence})`);

        if (finding.sourceLocation?.line) {
            steps.push(`Source location: ${finding.sourceLocation.toString()}`);
        }

        if (finding.pathCondition) {
            steps.push(`Governing path condition: ${finding.pathCondition}`);
        }

        for (const ev of finding.evidence) {
            if (ev.description) {
                steps.push(`Evidence: ${ev.description}`);
            }
        }

        return new VerificationExplanation({
            findingId: finding.id,
            kind: finding.kind,
            summary: finding.message,
            steps,
            evidence: finding.evidence,
            path: finding.relatedNodes || [],
            confidence: finding.confidence,
        });
    }

    toJSON() {
        return {
            findingId: this.findingId,
            kind: this.kind,
            summary: this.summary,
            steps: this.steps,
            evidence: this.evidence,
            path: this.path,
            confidence: this.confidence,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new VerificationExplanation(json);
    }
}
