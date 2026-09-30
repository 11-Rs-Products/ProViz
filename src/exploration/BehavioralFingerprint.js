/**
 * BehavioralFingerprint — Immutable structural fingerprint of an execution behavior.
 */

export class BehavioralFingerprint {
    /**
     * @param {object} params
     * @param {string} [params.returnType='undefined']
     * @param {string} [params.valueSummary='']
     * @param {string|null} [params.exceptionType=null]
     * @param {string|null} [params.pathSignature=null]
     * @param {Array<number|string>} [params.coveredBranches=[]]
     * @param {number} [params.mutationCount=0]
     * @param {object} [params.metadata={}]
     */
    constructor({
        returnType = 'undefined',
        outputType = null,
        valueSummary = '',
        outputRepr = null,
        exceptionType = null,
        pathSignature = null,
        coveredBranches = [],
        branchesCovered = null,
        mutationCount = 0,
        metadata = {},
    } = {}) {
        this.returnType = String(outputType || returnType);
        this.valueSummary = String(outputRepr !== null ? outputRepr : valueSummary);
        this.exceptionType = exceptionType ? String(exceptionType) : null;
        this.pathSignature = pathSignature ? String(pathSignature) : null;
        const branchList = branchesCovered || coveredBranches || [];
        this.coveredBranches = Object.freeze([...branchList].sort());
        this.mutationCount = Number(mutationCount);
        this.metadata = Object.freeze({ ...metadata });

        const hashPayload = JSON.stringify({
            returnType: this.returnType,
            valueSummary: this.valueSummary,
            exceptionType: this.exceptionType,
            pathSignature: this.pathSignature,
            coveredBranches: this.coveredBranches,
            mutationCount: this.mutationCount,
        });
        this.hashValue = `fp_${BehavioralFingerprint.computeHash(hashPayload)}`;
        const fn = () => this.hashValue;
        fn.toString = () => this.hashValue;
        fn.valueOf = () => this.hashValue;
        this.hash = fn;
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    static fromOutcome(outcome) {
        if (!outcome) return new BehavioralFingerprint();
        const retType = typeof outcome.returnValue;
        const valSummary = outcome.returnValue !== undefined ? JSON.stringify(outcome.returnValue) : '';
        const exType = outcome.exception ? (outcome.exception.type || outcome.exception.name || 'Exception') : null;
        const pathSig = outcome.pathId || outcome.symbolicPathId || null;
        const branches = outcome.coveredBranches || outcome.coveredLines || [];
        const mutCount = (outcome.heapMutations || []).length;

        return new BehavioralFingerprint({
            returnType: retType,
            valueSummary: valSummary,
            exceptionType: exType,
            pathSignature: pathSig,
            coveredBranches: branches,
            mutationCount: mutCount,
        });
    }

    equals(other) {
        if (!(other instanceof BehavioralFingerprint)) return false;
        return this.hash === other.hash;
    }

    toJSON() {
        return {
            hash: this.hash,
            returnType: this.returnType,
            valueSummary: this.valueSummary,
            exceptionType: this.exceptionType,
            pathSignature: this.pathSignature,
            coveredBranches: this.coveredBranches,
            mutationCount: this.mutationCount,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new BehavioralFingerprint(json);
    }
}
