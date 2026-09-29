/**
 * SemanticTestCase — Synthesized test case artifact with explicit objective, oracle, and provenance.
 */

import { Oracle } from './Oracle.js';
import { SpecificationConfidence } from './SpecificationConfidence.js';
import { SpecificationSource } from './SpecificationSource.js';

export class SemanticTestCase {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.targetFunction
     * @param {object} [params.inputs={}]
     * @param {object|null} [params.objective=null]
     * @param {Oracle|object|null} [params.oracle=null]
     * @param {Array<any>} [params.preconditions=[]]
     * @param {any} [params.expectedBehavior=null]
     * @param {string} [params.provenance=SpecificationSource.RUNTIME_OBSERVATION]
     * @param {string} [params.confidence=SpecificationConfidence.HIGH_CONFIDENCE]
     * @param {Array<string>} [params.coverageTargets=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        targetFunction,
        inputs = {},
        objective = null,
        oracle = null,
        preconditions = [],
        expectedBehavior = null,
        provenance = SpecificationSource.RUNTIME_OBSERVATION,
        confidence = SpecificationConfidence.HIGH_CONFIDENCE,
        coverageTargets = [],
        metadata = {},
    } = {}) {
        this.targetFunction = String(targetFunction || '');
        this.inputs = Object.freeze({ ...inputs });
        this.objective = objective ? Object.freeze({ ...objective }) : null;
        this.oracle = oracle instanceof Oracle ? oracle : (oracle ? Oracle.fromJSON(oracle) : null);
        this.preconditions = Object.freeze([...preconditions]);
        this.expectedBehavior = expectedBehavior;
        this.provenance = provenance;
        this.confidence = confidence;
        this.coverageTargets = Object.freeze([...coverageTargets]);
        this.metadata = Object.freeze({ ...metadata });

        const hashPayload = JSON.stringify({
            targetFunction: this.targetFunction,
            inputs: this.inputs,
            objectiveId: this.objective?.id,
            oracleId: this.oracle?.id,
            provenance: this.provenance,
        });

        this.id = id || `semantic_test_${SemanticTestCase.computeHash(hashPayload)}`;
        Object.freeze(this);
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    toJSON() {
        return {
            id: this.id,
            targetFunction: this.targetFunction,
            inputs: this.inputs,
            objective: this.objective,
            oracle: this.oracle ? this.oracle.toJSON() : null,
            preconditions: this.preconditions,
            expectedBehavior: this.expectedBehavior,
            provenance: this.provenance,
            confidence: this.confidence,
            coverageTargets: this.coverageTargets,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new SemanticTestCase(json);
    }
}
