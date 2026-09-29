/**
 * RootCause — Causal origin and dependency representation of a finding or failure.
 */

export const ROOT_CAUSE_EVIDENCE = Object.freeze({
    PROVEN: 'PROVEN',
    SUPPORTED: 'SUPPORTED',
    OBSERVED: 'OBSERVED',
    POSSIBLE: 'POSSIBLE',
    UNKNOWN: 'UNKNOWN',
});

export class RootCause {
    /**
     * @param {object} params
     * @param {object} params.location - { fileId, line, col }
     * @param {object} [params.finding=null]
     * @param {Array<object>} [params.dataflowOrigins=[]]
     * @param {Array<object>} [params.dependentDefinitions=[]]
     * @param {Array<object>} [params.controlDependencies=[]]
     * @param {Array<object>} [params.symbolicConstraints=[]]
     * @param {object|null} [params.concreteCounterexample=null]
     * @param {Array<object>} [params.relevantCallFrames=[]]
     * @param {Array<object>} [params.relevantObjects=[]]
     * @param {string} [params.evidence=ROOT_CAUSE_EVIDENCE.POSSIBLE]
     * @param {string} [params.variableName='']
     * @param {string} [params.explanation='']
     */
    constructor({
        location = {},
        finding = null,
        dataflowOrigins = [],
        dependentDefinitions = [],
        controlDependencies = [],
        symbolicConstraints = [],
        concreteCounterexample = null,
        relevantCallFrames = [],
        relevantObjects = [],
        evidence = ROOT_CAUSE_EVIDENCE.POSSIBLE,
        variableName = '',
        explanation = '',
    } = {}) {
        this.location = Object.freeze({ ...location });
        this.finding = finding ? Object.freeze({ ...finding }) : null;
        this.dataflowOrigins = Object.freeze([...dataflowOrigins]);
        this.dependentDefinitions = Object.freeze([...dependentDefinitions]);
        this.controlDependencies = Object.freeze([...controlDependencies]);
        this.symbolicConstraints = Object.freeze([...symbolicConstraints]);
        this.concreteCounterexample = concreteCounterexample ? Object.freeze({ ...concreteCounterexample }) : null;
        this.relevantCallFrames = Object.freeze([...relevantCallFrames]);
        this.relevantObjects = Object.freeze([...relevantObjects]);
        this.evidence = evidence;
        this.variableName = String(variableName || '');
        this.explanation = String(explanation || '');
        Object.freeze(this);
    }

    toJSON() {
        return {
            location: this.location,
            finding: this.finding,
            dataflowOrigins: this.dataflowOrigins,
            dependentDefinitions: this.dependentDefinitions,
            controlDependencies: this.controlDependencies,
            symbolicConstraints: this.symbolicConstraints,
            concreteCounterexample: this.concreteCounterexample,
            relevantCallFrames: this.relevantCallFrames,
            relevantObjects: this.relevantObjects,
            evidence: this.evidence,
            variableName: this.variableName,
            explanation: this.explanation,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new RootCause(json);
    }
}
