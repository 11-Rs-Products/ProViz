/**
 * Dependency — Explicit semantic dependency relationship between consumer and producer nodes.
 */

export class Dependency {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} [params.type] - 'data' | 'control' | 'alias' | 'mutation' | 'parameter' | 'return'
     * @param {string} params.consumerNodeId - Node consuming / depending on value
     * @param {string} params.producerNodeId - Node producing / providing value
     * @param {number} [params.frameIndex] - Frame index where dependency is created
     * @param {object|null} [params.sourceLocation] - Location descriptor
     * @param {object} [params.metadata]
     */
    constructor({
        id = null,
        type = 'data',
        consumerNodeId,
        producerNodeId,
        frameIndex = 0,
        sourceLocation = null,
        metadata = {},
    }) {
        if (!consumerNodeId || !producerNodeId) {
            throw new Error(`Dependency requires consumerNodeId and producerNodeId: consumer=${consumerNodeId}, producer=${producerNodeId}`);
        }
        this.type = type;
        this.consumerNodeId = consumerNodeId;
        this.producerNodeId = producerNodeId;
        this.frameIndex = typeof frameIndex === 'number' ? frameIndex : 0;
        this.sourceLocation = sourceLocation ? { ...sourceLocation } : null;
        this.metadata = { ...metadata };
        this.id = id || `df_dep_${type}_${producerNodeId}_to_${consumerNodeId}_f${this.frameIndex}`;
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            consumerNodeId: this.consumerNodeId,
            producerNodeId: this.producerNodeId,
            frameIndex: this.frameIndex,
            sourceLocation: this.sourceLocation,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new Dependency(json);
    }
}
