/**
 * SymbolicExplanation — Generates structured explanations of symbolic proofs and counterexamples.
 */

export class SymbolicExplanation {
    /**
     * @param {object} params
     * @param {string} params.target
     * @param {string} params.status - 'PROVEN' | 'DISPROVEN' | 'POSSIBLE' | 'UNKNOWN' | 'FEASIBLE' | 'UNREACHABLE'
     * @param {string} params.summary
     * @param {Array<string>} [params.steps]
     * @param {Array<string>} [params.assumptions]
     * @param {object|null} [params.model]
     */
    constructor({
        target,
        status,
        summary,
        steps = [],
        assumptions = [],
        model = null,
    }) {
        this.target = String(target);
        this.status = status;
        this.summary = String(summary);
        this.steps = Object.freeze([...steps]);
        this.assumptions = Object.freeze([...assumptions]);
        this.model = model ? Object.freeze({ ...model }) : null;
        Object.freeze(this);
    }

    static explainProof(proof) {
        if (!proof) return null;
        const steps = proof.steps.map(s => s.toString());
        return new SymbolicExplanation({
            target: proof.property,
            status: proof.status,
            summary: `Proof for '${proof.property}': ${proof.status}`,
            steps,
            assumptions: proof.assumptions,
        });
    }

    static explainCounterexample(cex) {
        if (!cex) return null;
        const steps = cex.steps.map(s => `${s.nodeId}: ${s.description}`);
        return new SymbolicExplanation({
            target: cex.property,
            status: 'DISPROVEN',
            summary: `Counterexample demonstrating '${cex.property}' with assignments: ${JSON.stringify(cex.assignments)}`,
            steps,
            model: cex.assignments,
        });
    }

    toJSON() {
        return {
            target: this.target,
            status: this.status,
            summary: this.summary,
            steps: this.steps,
            assumptions: this.assumptions,
            model: this.model,
        };
    }
}
