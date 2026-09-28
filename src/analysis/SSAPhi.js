/**
 * SSAPhi — Represents a Phi-node in SSA form merging values from predecessor blocks.
 */

export class SSAPhi {
    /**
     * @param {object} params
     * @param {string} [params.id]
     * @param {string} params.variableId - Base variable name
     * @param {string} params.resultValueId - Resulting SSAValue ID
     * @param {string} params.blockId - BasicBlock ID containing this phi node
     * @param {Array<object>} [params.incoming=[]] - [{ predecessorBlockId, valueId, variableVersion }]
     * @param {object|null} [params.sourceLocation=null]
     * @param {object} [params.metadata={}]
     */
    constructor({
        id = null,
        variableId,
        resultValueId,
        blockId,
        incoming = [],
        sourceLocation = null,
        metadata = {},
    }) {
        if (!variableId || !resultValueId || !blockId) {
            throw new Error('SSAPhi requires variableId, resultValueId, and blockId');
        }
        this.variableId = variableId;
        this.resultValueId = resultValueId;
        this.blockId = blockId;
        this.incoming = Array.isArray(incoming) ? incoming.map(inc => ({ ...inc })) : [];
        this.sourceLocation = sourceLocation ? { ...sourceLocation } : null;
        this.metadata = { ...metadata };
        this.id = id || `ssa_phi_${resultValueId}`;
    }

    addIncoming(predecessorBlockId, valueId, variableVersion = 0) {
        this.incoming.push({
            predecessorBlockId,
            valueId,
            variableVersion,
        });
    }

    toJSON() {
        return {
            id: this.id,
            variableId: this.variableId,
            resultValueId: this.resultValueId,
            blockId: this.blockId,
            incoming: this.incoming,
            sourceLocation: this.sourceLocation,
            metadata: this.metadata,
        };
    }

    static fromJSON(json) {
        if (!json || typeof json !== 'object') return null;
        return new SSAPhi(json);
    }
}
