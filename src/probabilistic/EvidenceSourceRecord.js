/**
 * EvidenceSourceRecord — Audit trail of evidence provenance and generation pipeline.
 */

export class EvidenceSourceRecord {
    constructor({
        sourceId = null,
        sourceType = 'STAGE_23_EXPLORATION',
        sourceStage = null,
        generatorStrategy = 'RANDOM',
        executionParameters = {},
        executionRunId = null,
        generatorSeed = null,
        metamorphicRelation = null,
        mutationOperator = null,
        symbolicPath = null,
        recordedAt = null,
        metadata = {},
    } = {}) {
        this.sourceId = sourceId || `src_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
        this.sourceType = sourceType || sourceStage || 'STAGE_23_EXPLORATION';
        this.sourceStage = sourceStage || this.sourceType;
        this.generatorStrategy = generatorStrategy;
        this.executionParameters = Object.freeze({ ...executionParameters });
        this.executionRunId = executionRunId ? String(executionRunId) : null;
        this.generatorSeed = generatorSeed !== null && generatorSeed !== undefined ? Number(generatorSeed) : null;
        this.metamorphicRelation = metamorphicRelation ? String(metamorphicRelation) : null;
        this.mutationOperator = mutationOperator ? String(mutationOperator) : null;
        this.symbolicPath = symbolicPath ? String(symbolicPath) : null;
        this.recordedAt = recordedAt || Date.now();
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }

    toJSON() {
        return {
            sourceId: this.sourceId,
            sourceType: this.sourceType,
            sourceStage: this.sourceStage,
            generatorStrategy: this.generatorStrategy,
            executionParameters: this.executionParameters,
            executionRunId: this.executionRunId,
            generatorSeed: this.generatorSeed,
            metamorphicRelation: this.metamorphicRelation,
            mutationOperator: this.mutationOperator,
            symbolicPath: this.symbolicPath,
            recordedAt: this.recordedAt,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json) return null;
        return new EvidenceSourceRecord(json);
    }
}
