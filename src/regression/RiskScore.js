/**
 * RiskScore — Multi-dimensional engineering analysis risk metric computed from semantic change impacts.
 */

export class RiskScore {
    /**
     * @param {object} params
     * @param {number} [params.total=0.0]
     * @param {object} [params.components={}]
     * @param {object} [params.metadata={}]
     */
    constructor({
        total = 0.0,
        components = {},
        metadata = {},
    } = {}) {
        this.total = Math.max(0, Math.min(1, Math.round(Number(total) * 1000) / 1000));
        this.components = Object.freeze({
            controlFlow: Number(components.controlFlow || 0),
            dataflow: Number(components.dataflow || 0),
            typeFlow: Number(components.typeFlow || 0),
            verification: Number(components.verification || 0),
            testCoverageGap: Number(components.testCoverageGap || 0),
            publicApi: Number(components.publicApi || 0),
            ...components,
        });
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    /**
     * Compute composite risk score from change set, impact results, and coverage.
     *
     * @param {import('./SemanticChangeSet.js').SemanticChangeSet} changeSet
     * @param {object} [impactResults=null]
     * @param {import('./ChangeCoverage.js').ChangeCoverage|null} [coverage=null]
     * @returns {RiskScore}
     */
    static compute(changeSet, impactResults = null, coverage = null) {
        if (!changeSet || changeSet.size === 0) {
            return new RiskScore({ total: 0.0 });
        }

        const changes = changeSet.changes;
        const hasCritical = changes.some(c => c.severity === 'CRITICAL' || c.severity === 'BLOCKER');
        const hasMajor = changes.some(c => c.severity === 'MAJOR');

        const controlFlowRisk = changes.some(c => c.kind.includes('CONTROL_FLOW') || c.kind.includes('BRANCH')) ? (hasCritical ? 0.9 : 0.6) : 0.1;
        const dataflowRisk = changes.some(c => c.kind.includes('DATA_') || c.kind.includes('DEFINITION')) ? 0.7 : 0.2;
        const typeFlowRisk = changes.some(c => c.kind.includes('TYPE_')) ? 0.5 : 0.1;
        const verificationRisk = changes.some(c => c.kind.includes('VERIFICATION_') && c.severity === 'CRITICAL') ? 0.95 : 0.2;

        const covRatio = coverage ? coverage.overallRatio : 1.0;
        const testCoverageGap = Math.max(0, 1.0 - covRatio);

        const components = {
            controlFlow: controlFlowRisk,
            dataflow: dataflowRisk,
            typeFlow: typeFlowRisk,
            verification: verificationRisk,
            testCoverageGap,
        };

        const total = Math.min(1.0, (controlFlowRisk * 0.25) + (dataflowRisk * 0.2) + (typeFlowRisk * 0.15) + (verificationRisk * 0.25) + (testCoverageGap * 0.15));

        return new RiskScore({ total, components });
    }

    toJSON() {
        return {
            total: this.total,
            components: this.components,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RiskScore(json);
    }
}
