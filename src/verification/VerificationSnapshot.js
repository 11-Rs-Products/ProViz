/**
 * VerificationSnapshot — Immutable, frozen representation of static verification analysis.
 */

import { Finding } from './Finding.js';
import { Property } from './Property.js';
import { Invariant } from './Invariant.js';
import { Contract } from './Contract.js';
import { VerificationGraph } from './VerificationGraph.js';

export class VerificationSnapshot {
    /**
     * @param {object} params
     * @param {number} [params.verificationVersion=1]
     * @param {string} [params.functionId='<module>']
     * @param {Array<Finding>} [params.findings]
     * @param {Array<Property>} [params.properties]
     * @param {Array<Invariant>} [params.invariants]
     * @param {Array<Contract>} [params.contracts]
     * @param {VerificationGraph|object} [params.verificationGraph]
     * @param {object} [params.functionSummaries]
     * @param {string} [params.status='SUCCESS']
     * @param {object} [params.metadata]
     */
    constructor({
        verificationVersion = 1,
        functionId = '<module>',
        findings = [],
        properties = [],
        invariants = [],
        contracts = [],
        verificationGraph = new VerificationGraph(),
        functionSummaries = {},
        status = 'SUCCESS',
        metadata = {},
    } = {}) {
        this.verificationVersion = verificationVersion;
        this.functionId = String(functionId || '<module>');
        this.findings = Object.freeze([...findings]);
        this.properties = Object.freeze([...properties]);
        this.invariants = Object.freeze([...invariants]);
        this.contracts = Object.freeze([...contracts]);
        this.verificationGraph = verificationGraph instanceof VerificationGraph
            ? verificationGraph
            : VerificationGraph.fromJSON(verificationGraph);
        this.functionSummaries = Object.freeze({ ...functionSummaries });
        this.status = status;
        this.metadata = Object.freeze({ ...metadata });

        Object.freeze(this);
    }

    equals(other) {
        if (!other || !(other instanceof VerificationSnapshot)) return false;
        return (
            this.verificationVersion === other.verificationVersion &&
            this.functionId === other.functionId &&
            this.status === other.status &&
            this.findings.length === other.findings.length &&
            this.properties.length === other.properties.length
        );
    }

    toJSON() {
        const summariesObj = {};
        for (const [k, v] of Object.entries(this.functionSummaries)) {
            summariesObj[k] = v;
        }
        return {
            verificationVersion: this.verificationVersion,
            functionId: this.functionId,
            findings: this.findings.map(f => f.toJSON()),
            properties: this.properties.map(p => p.toJSON()),
            invariants: this.invariants.map(i => i.toJSON()),
            contracts: this.contracts.map(c => c.toJSON()),
            verificationGraph: this.verificationGraph.toJSON(),
            functionSummaries: summariesObj,
            status: this.status,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new VerificationSnapshot({
            ...json,
            findings: (json.findings || []).map(f => Finding.fromJSON(f)),
            properties: (json.properties || []).map(p => Property.fromJSON(p)),
            invariants: (json.invariants || []).map(i => Invariant.fromJSON(i)),
            contracts: (json.contracts || []).map(c => Contract.fromJSON(c)),
            verificationGraph: VerificationGraph.fromJSON(json.verificationGraph),
        });
    }
}
