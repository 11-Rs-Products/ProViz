/**
 * MetamorphicRelation — Formal metamorphic relation between original and transformed input/output pairs.
 */

import { ExplorationConfidence } from './ExplorationConfidence.js';
import { ExplorationSource } from './ExplorationSource.js';

export class MetamorphicRelation {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.name
     * @param {string} [params.relationType='EQUIVALENCE']
     * @param {string} params.targetFunction
     * @param {string} params.transformation - Description or name of input transformation
     * @param {string} params.outputRelation - 'EQUALS', 'SUBSET', 'SUPERSET', 'GREATER_EQUAL', 'INVERSE', etc.
     * @param {string} [params.status='CANDIDATE'] - CANDIDATE, VALIDATED, VIOLATED, INCONCLUSIVE
     * @param {string} [params.confidence=ExplorationConfidence.OBSERVED]
     * @param {string} [params.source=ExplorationSource.METAMORPHIC]
     * @param {Array<string>} [params.evidence=[]]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        name,
        relationType = 'EQUIVALENCE',
        targetFunction,
        transformation,
        outputRelation = 'EQUALS',
        oracle = null,
        status = 'CANDIDATE',
        confidence = ExplorationConfidence.OBSERVED,
        source = ExplorationSource.METAMORPHIC,
        evidence = [],
        metadata = {},
    } = {}) {
        this.name = String(name || 'MetamorphicRelation');
        this.relationType = String(relationType);
        this.targetFunction = String(targetFunction || '');
        this.transformation = transformation || 'IDENTITY';
        this.outputRelation = typeof outputRelation === 'string' ? outputRelation : 'CUSTOM';
        this.oracle = oracle;
        this.status = String(status);
        this.confidence = String(confidence);
        this.source = String(source);
        this.evidence = Object.freeze([...evidence]);
        this.metadata = Object.freeze({ ...metadata });

        const hashPayload = JSON.stringify({
            name: this.name,
            relationType: this.relationType,
            targetFunction: this.targetFunction,
            transformation: typeof this.transformation === 'string' ? this.transformation : (this.transformation?.name || 'CUSTOM'),
            outputRelation: this.outputRelation,
        });
        this.id = id || `relation_${MetamorphicRelation.computeHash(hashPayload)}`;
    }

    static computeHash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    withStatus(newStatus, newEvidence = []) {
        return new MetamorphicRelation({
            ...this,
            status: newStatus,
            evidence: [...this.evidence, ...newEvidence],
        });
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            relationType: this.relationType,
            targetFunction: this.targetFunction,
            transformation: this.transformation,
            outputRelation: this.outputRelation,
            status: this.status,
            confidence: this.confidence,
            source: this.source,
            evidence: this.evidence,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new MetamorphicRelation(json);
    }
}
